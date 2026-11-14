'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { collectionName } from '@/lib/shop-meta';
import { money } from '@/lib/format';
import { loadRazorpayScript } from '@/lib/razorpay-client';
import ProductThumb from '@/components/ProductThumb';
import FallingPetals from '@/components/FallingPetals';
import PromoCodeField from '@/components/PromoCodeField';
import GiftOptions from '@/components/GiftOptions';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal: '',
  country: 'India',
};

const PENDING_CHECKOUT_KEY = 'vs-pending-checkout';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartTotal,
    cartShippingFee,
    cartPayable,
    cartGiftWrapFee,
    discountAmount,
    giftWrap,
    giftMessage,
    promo,
    cartCount,
    user,
    ready,
    addresses,
    selectedAddress,
    selectedAddressId,
    selectAddress,
    addAddress,
    placeOrder,
    clearCart,
    refreshOrders,
    getProduct,
  } = useStore();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [payStatus, setPayStatus] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const pollRef = useRef(null);
  const finishingRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/account?next=/checkout');
    }
  }, [ready, user, router]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const a = selectedAddress;
    const nameFromUser = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    setForm((current) => ({
      ...current,
      fullName: a?.fullName || nameFromUser || current.fullName,
      email: user?.email || current.email,
      phone: a?.phone || user?.phone || current.phone,
      line1: a?.line1 || current.line1,
      line2: a?.line2 || current.line2,
      city: a?.city || current.city,
      state: a?.state || current.state,
      postal: a?.postal || current.postal,
      country: a?.country || current.country || 'India',
    }));
  }, [user, selectedAddress]);

  const lines = useMemo(
    () =>
      cart.map((item) => {
        const product = getProduct(item.slug);
        const price = product?.price ?? item.price ?? 0;
        return {
          item,
          product: product || {
            slug: item.slug,
            name: item.name || item.slug,
            image: item.image,
            price,
            collection: '',
          },
          lineTotal: price * item.qty,
        };
      }),
    [cart, getProduct],
  );

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function splitName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || 'Guest',
      lastName: parts.slice(1).join(' ') || '',
    };
  }

  async function saveAsNewAddress() {
    setSavingAddr(true);
    setError('');
    try {
      await addAddress({
        label: 'Home',
        fullName: form.fullName,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        postal: form.postal,
        country: form.country,
        isDefault: true,
      });
      setShowNewAddress(false);
    } catch (err) {
      setError(err.message || 'Could not save address.');
    } finally {
      setSavingAddr(false);
    }
  }

  function buildShipping() {
    const { firstName, lastName } = splitName(form.fullName);
    return {
      firstName,
      lastName,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      line1: form.line1,
      line2: form.line2,
      address: [form.line1, form.line2].filter(Boolean).join(', '),
      city: form.city,
      state: form.state,
      postal: form.postal,
      country: form.country || 'India',
      addressId: selectedAddressId || null,
    };
  }

  function buildCheckoutBody(extra = {}) {
    return {
      items: cart,
      shipping: buildShipping(),
      email: form.email,
      discountCode: promo?.code || '',
      giftWrap,
      giftMessage,
      total: cartPayable,
      subtotal: cartTotal,
      shippingFee: cartShippingFee,
      ...extra,
    };
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function isConfirmedPaidOrder(order) {
    if (!order) return false;
    const db = String(order.dbStatus || '').toLowerCase();
    if (['paid', 'processing', 'shipped', 'delivered'].includes(db)) return true;
    const ui = String(order.status || '');
    return ['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(ui);
  }

  async function applyPaidOrder(order) {
    // Hard gate: never show success / clear cart unless order is actually paid.
    if (!isConfirmedPaidOrder(order)) {
      finishingRef.current = false;
      setPaying(false);
      setPayStatus('');
      setError('Payment was not completed. No order was placed.');
      return;
    }
    try {
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      sessionStorage.setItem('vs-order', JSON.stringify(order));
    } catch {
      /* ignore */
    }
    clearCart();
    try {
      await refreshOrders();
    } catch {
      /* ignore */
    }
    setError('');
    setSuccessOrder(order);
    setPaying(false);
    setPayStatus('');
    finishingRef.current = false;
  }

  async function finalizeOrder({
    paymentId,
    paymentMethod,
    demo = false,
    razorpayOrderId,
    razorpaySignature,
  }) {
    const order = await placeOrder({
      total: cartPayable,
      subtotal: cartTotal,
      shippingFee: cartShippingFee,
      discountCode: promo?.code || '',
      giftWrap,
      giftMessage,
      items: cart,
      shipping: buildShipping(),
      paymentId,
      paymentMethod: demo ? 'Demo (Razorpay pending keys)' : paymentMethod,
      email: form.email,
      status: 'Confirmed',
      demo,
      razorpayOrderId,
      razorpaySignature,
    });

    if (!isConfirmedPaidOrder(order)) {
      setError('Payment was not completed. No order was placed.');
      setPaying(false);
      setPayStatus('');
      return;
    }

    try {
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      sessionStorage.setItem('vs-order', JSON.stringify(order));
    } catch {
      /* ignore */
    }
    setError('');
    setSuccessOrder(order);
    setPaying(false);
    setPayStatus('');
  }

  function readPendingCheckout() {
    try {
      return JSON.parse(sessionStorage.getItem(PENDING_CHECKOUT_KEY) || 'null');
    } catch {
      return null;
    }
  }

  /** Server asks Razorpay if this order is paid (fixes live UPI when handler never fires). */
  async function syncPaidCheckout(razorpayOrderId, extra = {}) {
    if (!razorpayOrderId || finishingRef.current) return false;
    const pending = readPendingCheckout();
    const body =
      pending?.razorpayOrderId === razorpayOrderId
        ? { ...pending, ...extra, razorpayOrderId }
        : buildCheckoutBody({ razorpayOrderId, ...extra });
    const res = await fetch('/api/razorpay/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Payment sync failed');
    if (data.paid && data.order) {
      finishingRef.current = true;
      stopPolling();
      setPayStatus('Payment received — confirming order…');
      await applyPaidOrder(data.order);
      return true;
    }
    return false;
  }

  function startPaymentPoll(razorpayOrderId) {
    stopPolling();
    pollRef.current = setInterval(() => {
      syncPaidCheckout(razorpayOrderId).catch(() => {
        /* keep polling */
      });
    }, 2500);
  }

  // Resume fulfilment if customer paid but browser handler never ran (refresh / return).
  useEffect(() => {
    if (!ready || !user || successOrder) return;
    let cancelled = false;
    (async () => {
      let pending = null;
      try {
        pending = JSON.parse(sessionStorage.getItem(PENDING_CHECKOUT_KEY) || 'null');
      } catch {
        pending = null;
      }
      if (!pending?.razorpayOrderId || !pending?.items?.length) return;
      setPaying(true);
      setPayStatus('Checking your payment…');
      try {
        const res = await fetch('/api/razorpay/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(pending),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.paid && data.order) {
          finishingRef.current = true;
          await applyPaidOrder(data.order);
          return;
        }
        setPaying(false);
        setPayStatus('');
      } catch {
        if (!cancelled) {
          setPaying(false);
          setPayStatus('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot recovery on mount
  }, [ready, user, successOrder]);

  async function onPay(event) {
    event.preventDefault();
    setError('');
    setPayStatus('');

    if (!user) {
      router.replace('/account?next=/checkout');
      return;
    }

    if (!cart.length) {
      setError('Your bag is empty.');
      return;
    }

    if (!form.fullName || !form.email || !form.phone || !form.line1 || !form.city || !form.postal) {
      setError('Please complete your delivery details.');
      return;
    }

    setPaying(true);
    setPayStatus('Opening Razorpay…');
    finishingRef.current = false;
    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartPayable,
          currency: 'INR',
          receipt: `vs_${Date.now()}`,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Could not start payment');

      if (orderData.demo || !orderData.orderId) {
        await finalizeOrder({
          paymentId: `demo_${Date.now()}`,
          paymentMethod: 'Demo checkout',
          demo: true,
        });
        return;
      }

      const pendingSnapshot = buildCheckoutBody({ razorpayOrderId: orderData.orderId });
      try {
        sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(pendingSnapshot));
      } catch {
        /* ignore */
      }

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Razorpay failed to load. Check your connection.');
      }

      const { firstName, lastName } = splitName(form.fullName);
      const rzp = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Velvet Shell',
        description: 'Jewellery order',
        order_id: orderData.orderId,
        prefill: {
          name: `${firstName} ${lastName}`.trim(),
          email: form.email,
          contact: form.phone,
        },
        notes: { address: form.line1 },
        theme: { color: '#5E062A' },
        handler: async (response) => {
          try {
            setPayStatus('Payment received — confirming order…');
            stopPolling();
            const synced = await syncPaidCheckout(response.razorpay_order_id, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (synced) return;

            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
            await finalizeOrder({
              paymentId: response.razorpay_payment_id,
              paymentMethod: 'Razorpay',
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch (err) {
            setError(err.message || 'Payment could not be verified');
            setPaying(false);
            setPayStatus('');
          }
        },
        modal: {
          ondismiss: async () => {
            // User closed Razorpay (cancel / back). Only succeed if money was already captured.
            setPayStatus('Checking whether payment completed…');
            try {
              const paid = await syncPaidCheckout(orderData.orderId);
              if (paid) return;
            } catch (err) {
              setError(err.message || 'Could not confirm payment');
              stopPolling();
              setPaying(false);
              setPayStatus('');
              return;
            }
            stopPolling();
            setPaying(false);
            setPayStatus('');
            // Keep vs-pending-checkout so a slow UPI capture can still confirm on refresh.
            setError(
              'Payment not completed yet. No order is confirmed. If money was deducted, stay on this page or refresh — we will confirm only after Razorpay marks it paid.',
            );
          },
        },
      });

      rzp.on('payment.failed', (response) => {
        stopPolling();
        // Failed / insufficient funds / bank decline — never create a success order.
        setError(
          response?.error?.description ||
            'Payment failed. No order was placed. Please try again.',
        );
        setPaying(false);
        setPayStatus('');
        try {
          sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
        } catch {
          /* ignore */
        }
      });

      setPayStatus('Waiting for payment…');
      startPaymentPoll(orderData.orderId);
      rzp.open();
    } catch (err) {
      stopPolling();
      setError(err.message || 'Something went wrong');
      setPaying(false);
      setPayStatus('');
    }
  }

  if (!ready || !user) {
    return (
      <div className="bg-ivory pt-page pb-24">
        <div className="mx-auto max-w-md px-5 text-center">
          <p className="font-label text-gold">Checkout</p>
          <h1 className="font-display mt-3 text-4xl text-ink">Signing you in…</h1>
          <p className="mt-3 text-sm font-light text-ink/70">
            You’ll return here with your bag intact.
          </p>
        </div>
      </div>
    );
  }

  if (!cart.length && !successOrder) {
    return (
      <div className="bg-ivory pt-page pb-24">
        <div className="mx-auto max-w-xl px-5 text-center md:px-10">
          <p className="font-label text-gold">Checkout</p>
          <h1 className="font-display mt-3 text-4xl tracking-[-0.03em] text-ink md:text-5xl">
            Your bag is empty
          </h1>
          <p className="mt-4 text-sm font-light text-ink/70">Add a piece before checkout.</p>
          <Link
            href="/shop"
            className="bg-velvet-texture mt-8 inline-flex h-12 items-center rounded-full px-8 font-label text-[11px] tracking-[0.2em] text-ivory"
          >
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] overflow-x-clip bg-gradient-to-b from-[#faf6f1] to-ivory pt-page pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-20">
      {successOrder && isConfirmedPaidOrder(successOrder) && (
        <SuccessModal
          order={successOrder}
          onContinue={() => router.push('/account?tab=orders')}
        />
      )}

      <div className="mx-auto grid max-w-[1400px] gap-5 px-4 sm:gap-8 sm:px-5 md:grid-cols-12 md:items-start md:gap-10 md:px-10 lg:gap-14">
        {/* Bag first on phone so totals are visible before the long form */}
        <aside className="order-1 min-w-0 md:order-2 md:col-span-6 lg:col-span-7">
          {/* Explicit height so the bag card can scroll internally (max-height alone is not enough). */}
          <div className="flex h-[min(68svh,30rem)] flex-col sm:h-[min(72svh,36rem)] md:sticky md:top-[7.25rem] md:h-[calc(100svh-8.75rem)]">
            <OrderSummaryCard
              lines={lines}
              cartCount={cartCount}
              cartTotal={cartTotal}
              cartShippingFee={cartShippingFee}
              cartGiftWrapFee={cartGiftWrapFee}
              cartPayable={cartPayable}
              discountAmount={discountAmount}
              promo={promo}
              email={form.email || user?.email}
            />
          </div>
        </aside>

        <form onSubmit={onPay} className="order-2 min-w-0 md:order-1 md:col-span-6 lg:col-span-5">
          <p className="font-label text-[10px] tracking-[0.24em] text-gold uppercase">Checkout</p>
          <h1 className="font-display mt-2 text-[1.75rem] tracking-[-0.03em] text-burgundy sm:mt-3 sm:text-4xl md:text-5xl">
            Almost yours.
          </h1>
          <p className="mt-2.5 max-w-sm text-[13px] font-light leading-relaxed text-ink/70 sm:mt-3 sm:text-sm">
            Confirm delivery, then pay securely with Razorpay. Free shipping on orders ₹3,999 and
            above · ₹99 below.
          </p>

          {addresses.length > 0 && (
            <div className="mt-6 space-y-3 sm:mt-8">
              <div className="flex items-center justify-between gap-3">
                <p className="font-label text-[10px] tracking-[0.16em] text-ink/50 uppercase">
                  Deliver to
                </p>
                <button
                  type="button"
                  className="font-label shrink-0 text-[10px] tracking-[0.14em] text-burgundy"
                  onClick={() => setShowNewAddress((v) => !v)}
                >
                  {showNewAddress ? 'Use saved' : 'Add new address'}
                </button>
              </div>
              {!showNewAddress && (
                <div className="space-y-2">
                  {addresses.map((addr) => {
                    const active = addr.id === selectedAddressId;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => selectAddress(addr.id)}
                        className={`w-full rounded-2xl border px-3.5 py-3 text-left transition sm:px-4 sm:py-3.5 ${
                          active
                            ? 'border-burgundy/40 bg-white shadow-[0_8px_24px_rgba(94,6,42,0.06)]'
                            : 'border-ink/8 bg-white/50 hover:border-ink/15'
                        }`}
                      >
                        <p className="text-sm text-ink">
                          <span className="font-label text-[10px] tracking-[0.12em] text-gold uppercase">
                            {addr.label}
                          </span>
                          <span className="mt-1 block">{addr.fullName}</span>
                        </p>
                        <p className="mt-1 text-xs font-light text-ink/60">
                          {addr.line1}
                          {addr.city ? `, ${addr.city}` : ''} · {addr.postal}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(showNewAddress || addresses.length === 0) && (
            <div className="mt-5 space-y-3.5 rounded-[1.25rem] border border-ink/8 bg-white/70 p-3.5 sm:mt-8 sm:space-y-5 sm:rounded-3xl sm:p-6 md:p-8">
              <p className="font-label text-[10px] tracking-[0.16em] text-ink/50 uppercase">
                Delivery details
              </p>
              <Field
                label="Full name"
                value={form.fullName}
                onChange={(v) => updateField('fullName', v)}
                required
              />
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-5">
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => updateField('email', v)}
                  required
                />
                <Field
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => updateField('phone', v)}
                  required
                />
              </div>
              <Field
                label="Street address"
                value={form.line1}
                onChange={(v) => updateField('line1', v)}
                required
                placeholder="House, street, landmark"
              />
              <Field
                label="Apartment / floor"
                value={form.line2}
                onChange={(v) => updateField('line2', v)}
              />
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-5">
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => updateField('city', v)}
                  required
                />
                <Field
                  label="State"
                  value={form.state}
                  onChange={(v) => updateField('state', v)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-5">
                <Field
                  label="PIN code"
                  value={form.postal}
                  onChange={(v) => updateField('postal', v)}
                  required
                />
                <Field
                  label="Country"
                  value={form.country}
                  onChange={(v) => updateField('country', v)}
                  required
                />
              </div>
              {showNewAddress && (
                <button
                  type="button"
                  disabled={savingAddr}
                  onClick={saveAsNewAddress}
                  className="font-label text-[11px] tracking-[0.14em] text-burgundy disabled:opacity-60"
                >
                  {savingAddr ? 'Saving…' : 'Save this address to my account'}
                </button>
              )}
            </div>
          )}

          {!showNewAddress && addresses.length > 0 && (
            <div className="mt-6 rounded-2xl border border-ink/8 bg-white/50 px-4 py-4 sm:px-5">
              <p className="text-xs font-light text-ink/60">
                Shipping to the selected address. Need a tweak?{' '}
                <button
                  type="button"
                  className="text-burgundy"
                  onClick={() => setShowNewAddress(true)}
                >
                  Edit details
                </button>
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => updateField('email', v)}
                  required
                />
                <Field
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => updateField('phone', v)}
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-5 rounded-2xl bg-burgundy/8 px-4 py-3 text-sm text-burgundy">{error}</p>
          )}

          <button
            type="submit"
            disabled={paying || Boolean(successOrder)}
            className="bg-velvet-texture mt-7 inline-flex h-[3.25rem] w-full items-center justify-center rounded-full px-6 font-label text-[11px] tracking-[0.18em] text-ivory disabled:opacity-60 sm:mt-8 sm:h-[3.25rem] sm:w-auto sm:min-w-[260px] sm:px-8 sm:tracking-[0.2em]"
          >
            {paying ? (
              payStatus || 'Opening Razorpay…'
            ) : (
              <>
                Pay securely · <span className="font-num">{money(cartPayable)}</span>
              </>
            )}
          </button>
          <p className="mt-3 text-xs font-light text-ink/55">
            Card details are collected by Razorpay — never on this page.
            {paying
              ? ' Keep this tab open until you see the order confirmation.'
              : ''}
          </p>
        </form>
      </div>
    </div>
  );
}

const SUCCESS_MIN_MS = 2800;
const SUCCESS_AUTO_MS = 3500;

function SuccessModal({ order, onContinue }) {
  const [canLeave, setCanLeave] = useState(false);

  useEffect(() => {
    const unlock = setTimeout(() => setCanLeave(true), SUCCESS_MIN_MS);
    const auto = setTimeout(onContinue, SUCCESS_AUTO_MS);
    return () => {
      clearTimeout(unlock);
      clearTimeout(auto);
    };
  }, [onContinue]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm">
      <FallingPetals count={22} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-burgundy/10 bg-gradient-to-br from-[#faf6f1] to-[#efe4da] p-8 text-center shadow-[0_30px_80px_rgba(40,20,24,0.25)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-ivory">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="font-label mt-6 text-[10px] tracking-[0.24em] text-gold uppercase">
          Order confirmed
        </p>
        <h2 className="font-display mt-3 text-3xl text-burgundy">Thank you</h2>
        <p className="mt-3 text-sm font-light text-ink/70">
          {order.orderNumber || order.id} · {money(order.total)}
        </p>
        <p className="mt-2 text-xs font-light text-ink/55">
          A confirmation email is on its way. Taking you to order history…
        </p>
        <button
          type="button"
          onClick={() => {
            if (canLeave) onContinue();
          }}
          disabled={!canLeave}
          className="bg-velvet-texture mt-8 inline-flex h-12 w-full items-center justify-center rounded-full font-label text-[11px] tracking-[0.2em] text-ivory disabled:opacity-70"
        >
          View orders
        </button>
      </div>
    </div>
  );
}

function OrderSummaryCard({
  lines,
  cartCount,
  cartTotal,
  cartShippingFee = 0,
  cartGiftWrapFee = 0,
  cartPayable,
  discountAmount,
  promo,
  email,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-ink/8 bg-white/80 shadow-[0_20px_60px_rgba(40,20,24,0.06)] sm:rounded-[1.5rem] lg:rounded-[1.75rem]">
      <div className="shrink-0 border-b border-ink/8 px-3.5 py-3.5 sm:px-5 sm:py-4 md:px-6 md:py-5">
        <p className="font-label text-[10px] tracking-[0.18em] text-gold uppercase">Your bag</p>
        <p className="mt-1 text-sm text-ink/70">
          {cartCount} {cartCount === 1 ? 'piece' : 'pieces'}
        </p>
      </div>

      {/* Bounded flex child — this is the only scroll surface for line items */}
      <div
        className="checkout-bag-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3.5 py-3.5 sm:px-5 sm:py-4 md:px-6 md:py-5"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        onWheel={(e) => {
          // Keep wheel focus on the bag list so the page doesn't scroll instead.
          e.stopPropagation();
        }}
      >
        <ul className="space-y-3.5 sm:space-y-4">
          {lines.map(({ item, product, lineTotal }) => (
            <li key={item.id} className="flex min-w-0 gap-2.5 sm:gap-4">
              <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-cream ring-1 ring-ink/6 sm:h-20 sm:w-16">
                <ProductThumb
                  product={product}
                  item={item}
                  alt={product.name || item.name}
                  sizes="64px"
                  className="object-cover object-center"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink sm:text-sm">
                  {product.name || item.name}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-light text-ink/55 sm:text-[11px]">
                  {collectionName(
                    typeof product.collection === 'string'
                      ? product.collection
                      : product.collection_slug || product.collection?.slug || '',
                  )}{' '}
                  · {item.metal} · {item.size}
                </p>
                {Array.isArray(item.customization) && item.customization.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-[10px] text-ink/65 sm:text-[11px]">
                    {item.customization.map((entry, i) => (
                      <li key={`${entry.id || entry.label}-${i}`} className="break-words">
                        {entry.label}: {entry.value}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-1 text-[11px] text-ink/60 sm:text-xs">Qty {item.qty}</p>
              </div>
              <p className="font-num shrink-0 text-[13px] text-ink sm:text-sm">{money(lineTotal)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 shrink-0 space-y-2 border-t border-ink/8 px-3.5 py-3 sm:space-y-2.5 sm:px-5 sm:py-4 md:px-6">
        <GiftOptions compact />
        <PromoCodeField email={email} compact />
        <div className="space-y-0.5 pt-0.5 text-[12px] sm:text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink/60">Subtotal</span>
            <span className="font-num shrink-0 text-ink">{money(cartTotal)}</span>
          </div>
          {discountAmount > 0 ? (
            <div className="flex items-center justify-between gap-3 text-emerald-800">
              <span className="min-w-0 truncate">
                Discount{promo?.code ? ` (${promo.code})` : ''}
              </span>
              <span className="font-num shrink-0">−{money(discountAmount)}</span>
            </div>
          ) : null}
          {cartGiftWrapFee > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink/60">Gift wrap</span>
              <span className="font-num shrink-0 text-ink">{money(cartGiftWrapFee)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink/60">Shipping</span>
            <span className="font-num shrink-0 text-ink">
              {cartShippingFee > 0 ? money(cartShippingFee) : 'Free'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <span className="font-label text-[9px] tracking-[0.14em] text-ink/50 uppercase sm:text-[10px]">
              Total
            </span>
            <span className="font-num shrink-0 text-lg text-burgundy sm:text-xl">
              {money(cartPayable)}
            </span>
          </div>
        </div>
        <p className="text-[11px] font-light leading-relaxed text-ink/50">
          {cartShippingFee > 0
            ? 'Free shipping on orders ₹3,999 and above'
            : 'Complimentary shipping on this order'}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <label className="block min-w-0">
      <span className="font-label text-[10px] tracking-[0.14em] text-ink/50 uppercase">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
        autoComplete={
          type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined
        }
        onChange={(e) => onChange(e.target.value)}
        className="field-control mt-1.5 sm:mt-2"
      />
    </label>
  );
}
