/**
 * Velvet Shell transactional emails
 * Minimal professional: white / black / grey · system sans · responsive
 */

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const C = {
  bg: '#f5f5f5',
  card: '#ffffff',
  ink: '#111111',
  body: '#444444',
  muted: '#737373',
  line: '#e5e5e5',
  soft: '#fafafa',
  btnBg: '#111111',
  btnText: '#ffffff',
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Greeting with real name only — never a dummy “there” / placeholder. */
function greetHtml(...candidates) {
  for (const candidate of candidates) {
    const name = String(candidate || '').trim();
    if (name) return `Hello ${escapeHtml(name)},`;
  }
  return 'Hello,';
}

export function formatInr(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

/** Never fall back to onboarding@resend.dev — that lands in spam. */
export function fromAddress() {
  const env = String(process.env.RESEND_FROM_EMAIL || '').trim();
  const verified = 'Velvet Shell <sales@velvetshell.in>';
  if (env && !/resend\.dev/i.test(env)) return env;
  if (env && /resend\.dev/i.test(env)) {
    console.warn(
      '[mail] RESEND_FROM_EMAIL uses resend.dev — using verified domain instead',
    );
  }
  return verified;
}

export function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.STOREFRONT_ORIGIN ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    '';
  if (raw) {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    if (!/localhost|127\.0\.0\.1/i.test(withProto)) {
      return withProto.replace(/\/$/, '');
    }
  }
  return 'https://velvetshell.in';
}

export function lookLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

/** Owner / ops inboxes — never use ADMIN_EMAIL login usernames. */
export function ownerNotifyEmails() {
  const raw = [process.env.ORDERS_NOTIFY_EMAIL, process.env.RESEND_TO_OWNER]
    .filter(Boolean)
    .join(',');
  const seen = new Set();
  const list = [];
  for (const part of raw.split(/[,;]+/)) {
    const email = String(part || '').trim().toLowerCase();
    if (!lookLikeEmail(email) || seen.has(email)) continue;
    seen.add(email);
    list.push(email);
  }
  return list;
}

function preheaderHtml(text) {
  const t = escapeHtml(text || '');
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${t}${'&nbsp;'.repeat(30)}</div>`;
}

function btn(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td align="center" bgcolor="${C.btnBg}" style="border-radius:4px;">
          <a href="${escapeHtml(href)}"
             style="display:inline-block;background:${C.btnBg};color:${C.btnText};text-decoration:none;font-family:${FONT};font-size:13px;font-weight:600;letter-spacing:0.04em;padding:14px 28px;border-radius:4px;line-height:1.2;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/**
 * Responsive shell: ~100% on phones, 600px card on desktop.
 * Colours: white card, black type, grey accents only.
 */
export function emailShell({ preheader, eyebrow, title, introHtml = '', bodyHtml, footerNote }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title || 'Velvet Shell')}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <noscript>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    html, body { margin:0 !important; padding:0 !important; width:100% !important; }
    * { -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { color:${C.ink}; }
    @media only screen and (max-width: 620px) {
      .vs-outer { padding:16px 12px !important; }
      .vs-pad { padding-left:20px !important; padding-right:20px !important; }
      .vs-title { font-size:22px !important; line-height:1.3 !important; }
      .vs-intro { font-size:14px !important; }
      .vs-stack { display:block !important; width:100% !important; }
    }
    @media only screen and (min-width: 621px) {
      .vs-outer { padding:40px 24px !important; }
      .vs-inner { width:600px !important; max-width:600px !important; }
      .vs-pad { padding-left:40px !important; padding-right:40px !important; }
      .vs-title { font-size:26px !important; line-height:1.3 !important; }
      .vs-intro { font-size:15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg};color:${C.ink};width:100%;">
  ${preheaderHtml(preheader)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="vs-outer" style="background:${C.bg};padding:24px 16px;width:100%;">
    <tr>
      <td align="center" style="width:100%;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="vs-inner" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${C.ink};">Velvet Shell</p>
            </td>
          </tr>
          <tr>
            <td style="background:${C.card};border:1px solid ${C.line};border-radius:8px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:3px;background:${C.ink};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="vs-pad" style="padding:28px 24px 8px;">
                    ${
                      eyebrow
                        ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.muted};">${escapeHtml(eyebrow)}</p>`
                        : ''
                    }
                    <h1 class="vs-title" style="margin:0;font-family:${FONT};font-weight:600;font-size:24px;line-height:1.3;color:${C.ink};">${escapeHtml(title)}</h1>
                    ${
                      introHtml
                        ? `<div class="vs-intro" style="margin:14px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.body};">${introHtml}</div>`
                        : ''
                    }
                  </td>
                </tr>
                <tr>
                  <td class="vs-pad" style="padding:12px 24px 32px;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 12px 8px;text-align:center;">
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};">
                ${footerNote || `© ${year} Velvet Shell`}
              </p>
              <p style="margin:8px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};">
                Working hours: 10 am to 7 pm (IST)
              </p>
              <p style="margin:8px 0 0;font-family:${FONT};font-size:12px;color:${C.muted};">
                <a href="${siteUrl()}" style="color:${C.ink};text-decoration:underline;">velvetshell.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function sectionTitle(label) {
  return `<p style="margin:28px 0 10px;font-family:${FONT};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};border-top:1px solid ${C.line};padding-top:20px;">${escapeHtml(label)}</p>`;
}

export function kvTable(rows) {
  const body = (rows || [])
    .filter((r) => r && r.value != null && String(r.value).trim() !== '')
    .map(
      (r) => `
      <tr>
        <td class="vs-stack" style="padding:10px 0;border-bottom:1px solid ${C.line};vertical-align:top;width:36%;font-family:${FONT};font-size:12px;color:${C.muted};">${escapeHtml(r.label)}</td>
        <td class="vs-stack" style="padding:10px 0;border-bottom:1px solid ${C.line};vertical-align:top;font-family:${FONT};font-size:13px;color:${C.ink};text-align:right;">${r.html ? r.value : escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">${body}</table>`;
}

function itemMeta(item) {
  const color = item.color_label || item.colorLabel || '';
  const bits = [color, item.metal, item.size ? `Size ${item.size}` : '']
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  return bits.join(' · ');
}

export function lineItemsTable(items = [], { showSku = false } = {}) {
  const rows = (items || [])
    .map((item) => {
      const title = escapeHtml(item.product_name || item.name || item.product_slug || 'Item');
      const meta = escapeHtml(itemMeta(item));
      const sku = String(item.sku || '').trim();
      const qty = item.qty || 1;
      const line = formatInr(
        item.line_total ?? item.lineTotal ?? (Number(item.unit_price || item.price) || 0) * qty,
      );
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${C.line};vertical-align:top;">
            ${
              showSku && sku
                ? `<div style="font-family:${FONT};font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};font-weight:600;margin-bottom:4px;">SKU ${escapeHtml(sku)}</div>`
                : ''
            }
            <div style="font-family:${FONT};font-size:14px;font-weight:500;color:${C.ink};">${title}</div>
            ${meta ? `<div style="margin-top:4px;font-family:${FONT};font-size:12px;color:${C.muted};">${meta}</div>` : ''}
          </td>
          <td style="padding:14px 8px;border-bottom:1px solid ${C.line};vertical-align:top;text-align:center;white-space:nowrap;font-family:${FONT};font-size:13px;color:${C.body};">×${qty}</td>
          <td style="padding:14px 0;border-bottom:1px solid ${C.line};vertical-align:top;text-align:right;white-space:nowrap;font-family:${MONO};font-size:13px;color:${C.ink};">${line}</td>
        </tr>`;
    })
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">
      <tr>
        <td style="padding:0 0 8px;font-family:${FONT};font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">Item</td>
        <td style="padding:0 8px 8px;text-align:center;font-family:${FONT};font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">Qty</td>
        <td style="padding:0 0 8px;text-align:right;font-family:${FONT};font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">Amount</td>
      </tr>
      ${rows}
    </table>`;
}

export function giftBlock(order) {
  const wrap = Boolean(order.gift_wrap ?? order.giftWrap);
  const wrapFee = Number(order.gift_wrap_fee ?? order.giftWrapFee) || 0;
  const message = String(order.gift_message || order.giftMessage || '').trim();
  if (!wrap && !message) return '';

  const rows = [];
  if (wrap) {
    rows.push({
      label: 'Gift wrap',
      value: wrapFee > 0 ? `Yes · ${formatInr(wrapFee)}` : 'Yes',
    });
  }
  if (message) {
    rows.push({
      label: 'Gift message',
      value: escapeHtml(message).replace(/\n/g, '<br/>'),
      html: true,
    });
  }

  return `
    ${sectionTitle('Gift')}
    ${kvTable(rows)}`;
}

export function totalsBlock(order) {
  const subtotal = Number(order.subtotal) || 0;
  const shipping = Number(order.shipping_fee ?? order.shippingFee) || 0;
  const discount = Number(order.discount_amount ?? order.discountAmount) || 0;
  const giftWrapFee = Number(order.gift_wrap_fee ?? order.giftWrapFee) || 0;
  const giftWrap = Boolean(order.gift_wrap ?? order.giftWrap);
  const code = String(order.discount_code || order.discountCode || '').trim();
  const total =
    Number(order.total) ||
    Math.max(0, subtotal - discount + shipping + (giftWrap ? giftWrapFee : 0));

  const rows = [{ label: 'Subtotal', value: formatInr(subtotal) }];
  if (discount > 0) {
    rows.push({
      label: code ? `Discount (${code})` : 'Discount',
      value: `−${formatInr(discount)}`,
    });
  }
  if (giftWrap && giftWrapFee > 0) {
    rows.push({ label: 'Gift wrap', value: formatInr(giftWrapFee) });
  }
  rows.push({
    label: 'Shipping',
    value: shipping > 0 ? formatInr(shipping) : 'Free',
  });
  rows.push({ label: 'Total paid', value: formatInr(total), strong: true });

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;width:100%;">
      ${rows
        .map(
          (r) => `
        <tr>
          <td style="padding:8px 0;font-family:${FONT};font-size:${r.strong ? '14px' : '13px'};color:${r.strong ? C.ink : C.muted};font-weight:${r.strong ? '600' : '400'};">${escapeHtml(r.label)}</td>
          <td style="padding:8px 0;text-align:right;font-family:${MONO};font-size:${r.strong ? '15px' : '13px'};color:${C.ink};font-weight:${r.strong ? '600' : '400'};">${escapeHtml(r.value)}</td>
        </tr>`,
        )
        .join('')}
    </table>`;
}

export function shippingBlock(order) {
  const ship = order.shipping || {};
  const name =
    ship.fullName ||
    [ship.firstName, ship.lastName].filter(Boolean).join(' ') ||
    '';
  const line1 = ship.line1 || ship.address || '';
  const line2 = ship.line2 || '';
  const cityLine = [ship.city, ship.state, ship.postal || ship.pincode]
    .filter(Boolean)
    .join(', ');
  const country = ship.country || 'India';
  const phone = ship.phone || ship.mobile || '';
  const email = order.email || ship.email || '';

  const addressHtml = [name, line1, line2, cityLine, country]
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br/>');

  return kvTable([
    { label: 'Name', value: name },
    { label: 'Email', value: email },
    { label: 'Phone', value: phone },
    { label: 'Address', value: addressHtml || '—', html: true },
  ]);
}

export function paymentBlock(order) {
  const paymentId =
    order.razorpay_payment_id ||
    order.paymentId ||
    order.payments?.[0]?.razorpay_payment_id ||
    '';
  const razorpayOrder =
    order.razorpay_order_id || order.razorpayOrderId || '';
  const method = order.paymentMethod || 'Razorpay';
  const demo = /demo/i.test(String(order.notes || '')) || order.demo;

  return kvTable([
    { label: 'Method', value: demo ? `${method} (demo)` : method },
    { label: 'Status', value: demo ? 'Demo / test' : 'Paid' },
    { label: 'Razorpay order', value: razorpayOrder },
    { label: 'Payment ID', value: paymentId },
    { label: 'Currency', value: order.currency || 'INR' },
  ]);
}

export function ctaBlock(href, label) {
  return `<div style="margin-top:28px;text-align:center;">${btn(href, label)}</div>`;
}

function orderBasics(order) {
  const orderNo = order.order_number || order.orderNumber || order.id;
  return {
    orderNo,
    placed: formatDate(order.created_at || order.createdAt),
  };
}

/** Buyer: order confirmed */
export function renderBuyerOrderEmail({ order, items, customerName }) {
  const { orderNo, placed } = orderBasics(order);
  const greeting = greetHtml(
    customerName,
    order.shipping?.fullName,
    order.shipping?.firstName,
  );
  const body = `
    ${sectionTitle('Order')}
    ${kvTable([
      { label: 'Order number', value: orderNo },
      { label: 'Placed', value: placed },
      { label: 'Status', value: 'Confirmed' },
    ])}
    ${sectionTitle('Items')}
    ${lineItemsTable(items)}
    ${giftBlock(order)}
    ${sectionTitle('Summary')}
    ${totalsBlock(order)}
    ${sectionTitle('Delivery')}
    ${shippingBlock(order)}
    ${sectionTitle('Payment')}
    ${paymentBlock(order)}
    ${ctaBlock(`${siteUrl()}/account?tab=orders`, 'View your orders')}
  `;
  return {
    subject: `Order ${orderNo} confirmed · Velvet Shell`,
    html: emailShell({
      preheader: `Your Velvet Shell order ${orderNo} is confirmed · ${formatInr(order.total)}`,
      eyebrow: 'Order confirmation',
      title: 'Thank you for your order',
      introHtml: `${greeting} we’ve received your Velvet Shell order and payment. Here’s everything you need.`,
      bodyHtml: body,
    }),
  };
}

/** Owner: new order */
export function renderOwnerOrderEmail({ order, items }) {
  const { orderNo, placed } = orderBasics(order);
  const toCustomer = String(order.email || '').trim().toLowerCase();
  const body = `
    ${sectionTitle('Order')}
    ${kvTable([
      { label: 'Order number', value: orderNo },
      { label: 'Placed', value: placed },
      { label: 'Total', value: formatInr(order.total) },
      { label: 'Customer', value: toCustomer },
    ])}
    ${sectionTitle('Customer & delivery')}
    ${shippingBlock(order)}
    ${sectionTitle('Payment')}
    ${paymentBlock(order)}
    ${sectionTitle('Line items')}
    ${lineItemsTable(items, { showSku: true })}
    ${giftBlock(order)}
    ${sectionTitle('Summary')}
    ${totalsBlock(order)}
  `;
  return {
    subject: `New order ${orderNo} · Velvet Shell`,
    html: emailShell({
      preheader: `New order ${orderNo} · ${formatInr(order.total)} · ${toCustomer}`,
      eyebrow: 'Orders',
      title: 'New order received',
      introHtml: 'A prepaid order is ready for fulfilment. Review customer, payment and SKUs below.',
      bodyHtml: body,
    }),
  };
}

/** Buyer + owner shipment / delivered */
export function renderBuyerShipmentEmail({ order, items, event, customerName }) {
  const { orderNo } = orderBasics(order);
  const isDelivered = event === 'delivered';
  const greeting = greetHtml(
    customerName,
    order.shipping?.fullName,
    order.shipping?.firstName,
  );
  const awb = order.awb || '';
  const trackingUrl =
    order.tracking_url ||
    order.trackingUrl ||
    (awb
      ? `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`
      : '');

  const body = `
    ${sectionTitle('Shipment')}
    ${kvTable([
      { label: 'Order number', value: orderNo },
      { label: 'Courier', value: order.courier || 'Delhivery' },
      { label: 'AWB', value: awb },
      {
        label: 'Status',
        value: isDelivered
          ? 'Delivered'
          : order.shipment_status || order.shipmentStatus || 'Shipped',
      },
    ])}
    ${trackingUrl ? ctaBlock(trackingUrl, 'Track shipment') : ''}
    ${sectionTitle('Items')}
    ${lineItemsTable(items)}
    ${sectionTitle('Delivering to')}
    ${shippingBlock(order)}
    ${ctaBlock(`${siteUrl()}/account?tab=orders`, 'View your orders')}
  `;

  return {
    subject: isDelivered
      ? `Delivered · Order ${orderNo} · Velvet Shell`
      : `Shipped · Order ${orderNo} · Velvet Shell`,
    html: emailShell({
      preheader: isDelivered
        ? `Order ${orderNo} was delivered`
        : `Order ${orderNo} is on the way${awb ? ` · AWB ${awb}` : ''}`,
      eyebrow: isDelivered ? 'Delivered' : 'On the way',
      title: isDelivered ? 'Your order was delivered' : 'Your order is on the way',
      introHtml: isDelivered
        ? `${greeting} your Velvet Shell order has been delivered. We hope you love it.`
        : `${greeting} your Velvet Shell order has been handed to the courier. Use the tracking details below anytime.`,
      bodyHtml: body,
    }),
  };
}

export function renderOwnerShipmentEmail({ order, event }) {
  const { orderNo } = orderBasics(order);
  const isDelivered = event === 'delivered';
  const awb = order.awb || '';
  const trackingUrl =
    order.tracking_url ||
    order.trackingUrl ||
    (awb
      ? `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`
      : '');
  const toCustomer = String(order.email || '').trim().toLowerCase();

  const body = `
    ${sectionTitle('Shipment')}
    ${kvTable([
      { label: 'Order number', value: orderNo },
      { label: 'Customer', value: toCustomer },
      { label: 'AWB', value: awb },
      { label: 'Courier', value: order.courier || 'Delhivery' },
      {
        label: 'Status',
        value: isDelivered
          ? 'Delivered'
          : order.shipment_status || order.shipmentStatus || 'Manifested',
      },
    ])}
    ${trackingUrl ? ctaBlock(trackingUrl, 'Open tracking') : ''}
    ${sectionTitle('Delivery address')}
    ${shippingBlock(order)}
  `;

  return {
    subject: isDelivered
      ? `Delivered ${orderNo} · Velvet Shell`
      : `Shipped ${orderNo} · AWB ${awb || '—'} · Velvet Shell`,
    html: emailShell({
      preheader: isDelivered
        ? `Delivered ${orderNo}`
        : `Shipment booked ${orderNo} · AWB ${awb}`,
      eyebrow: 'Logistics',
      title: isDelivered ? 'Order delivered' : 'Shipment booked',
      introHtml: isDelivered
        ? 'Courier marked this order as delivered.'
        : 'A shipment AWB was created for this order.',
      bodyHtml: body,
    }),
  };
}

export function renderPasswordResetEmail({ fullName, code, accountUrl, loginUrl }) {
  const greeting = greetHtml(fullName);
  const body = `
    <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.body};">
      ${greeting} use this one-time code to reset your Velvet Shell password. It expires in 15 minutes.
    </p>
    <div style="margin:8px 0 24px;padding:20px;border:1px solid ${C.line};border-radius:6px;background:${C.soft};text-align:center;">
      <p style="margin:0;font-family:${MONO};font-size:28px;letter-spacing:0.22em;color:${C.ink};font-weight:600;">${escapeHtml(code)}</p>
    </div>
    ${ctaBlock(accountUrl, 'Enter code & reset')}
    <p style="margin:20px 0 0;text-align:center;font-family:${FONT};font-size:12px;color:${C.muted};">
      Or <a href="${escapeHtml(loginUrl)}" style="color:${C.ink};text-decoration:underline;">sign in to your account</a>
    </p>
  `;
  return {
    subject: 'Your Velvet Shell password reset code',
    html: emailShell({
      preheader: 'Your password reset code · expires in 15 minutes',
      eyebrow: 'Security',
      title: 'Reset your password',
      bodyHtml: body,
      footerNote: 'If you did not request this, you can ignore this email.',
    }),
  };
}

export function renderStockAvailableEmail({ productName, productUrl }) {
  const title = productName || 'Your piece';
  const body = `
    <p style="margin:0 0 8px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.body};">
      Good news — <strong style="color:${C.ink};font-weight:600;">${escapeHtml(title)}</strong> is back in stock.
    </p>
    <p style="margin:0 0 8px;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.muted};">
      Stock is limited. Use the button below to view the product and buy while it’s available.
    </p>
    ${ctaBlock(productUrl, 'Buy now')}
  `;
  return {
    subject: `Back in stock · ${String(title).slice(0, 60)} · Velvet Shell`,
    html: emailShell({
      preheader: `${title} is back in stock — buy now`,
      eyebrow: 'Back in stock',
      title: 'It’s available again',
      bodyHtml: body,
    }),
  };
}

export function renderGiftingEnquiryEmail({ name, email, phone, occasion, note }) {
  const body = `
    ${sectionTitle('Enquiry')}
    ${kvTable([
      { label: 'Name', value: name },
      { label: 'Email', value: email },
      { label: 'Phone', value: phone || '—' },
      { label: 'Occasion', value: occasion || 'Not specified' },
    ])}
    ${sectionTitle('Note')}
    <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.body};white-space:pre-wrap;">${escapeHtml(note || '—')}</p>
  `;
  return {
    subject: `Gifting enquiry · ${String(occasion || 'Velvet Shell').slice(0, 48)}`,
    html: emailShell({
      preheader: `Gifting enquiry from ${name}`,
      eyebrow: 'Gifting',
      title: 'New gifting enquiry',
      introHtml: 'Someone reached out about a gift or custom piece.',
      bodyHtml: body,
    }),
  };
}

export function renderContactEnquiryEmail({ name, email, phone, interest, message }) {
  const body = `
    ${sectionTitle('Enquiry')}
    ${kvTable([
      { label: 'Name', value: name },
      { label: 'Email', value: email },
      { label: 'Phone', value: phone || '—' },
      { label: 'Interest', value: interest || 'General enquiry' },
    ])}
    ${sectionTitle('Message')}
    <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.body};white-space:pre-wrap;">${escapeHtml(message || '—')}</p>
  `;
  return {
    subject: `Contact enquiry · ${String(interest || name || 'Velvet Shell').slice(0, 48)}`,
    html: emailShell({
      preheader: `Contact enquiry from ${name}`,
      eyebrow: 'Contact',
      title: 'New contact enquiry',
      introHtml: 'Someone wrote in from the Contact / Enquire page.',
      bodyHtml: body,
    }),
  };
}
