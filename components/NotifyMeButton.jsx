'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';

/**
 * Back-in-stock waitlist for a product or set slug.
 * Logged-in users: one tap uses account email (no form).
 * Guests: ask for email.
 * variant="card" — compact control for shop grid cards.
 */
export default function NotifyMeButton({
  slug,
  kind = 'product',
  name = '',
  className = '',
  variant = 'default',
}) {
  const { user } = useStore();
  const sessionEmail = String(user?.email || '')
    .trim()
    .toLowerCase();
  const loggedIn = Boolean(sessionEmail);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const isCard = variant === 'card';

  async function submitNotify(toEmail) {
    const clean = String(toEmail || '')
      .trim()
      .toLowerCase();
    if (!clean) {
      setError('Enter your email');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/stock-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, slug, kind, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save your request');
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  function stop(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function onPrimaryClick(e) {
    stop(e);
    if (busy || done) return;
    if (loggedIn) {
      await submitNotify(sessionEmail);
      return;
    }
    setOpen(true);
  }

  async function onSubmit(e) {
    stop(e);
    await submitNotify(email);
  }

  const cardBtnClass =
    className ||
    'bg-velvet-texture relative inline-flex h-8 min-w-[4.25rem] shrink-0 items-center justify-center rounded-full px-3 py-1.5 font-label text-[8px] tracking-[0.1em] text-ivory uppercase transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-70 md:h-10 md:min-w-[6.5rem] md:px-5 md:py-2 md:text-[9px] md:tracking-[0.14em]';

  const defaultBtnClass =
    className ||
    'flex h-[52px] flex-1 items-center justify-center rounded-full border border-ink/20 bg-white text-[11px] tracking-[0.28em] text-ink uppercase disabled:opacity-70';

  if (done) {
    if (isCard) {
      return (
        <p className="inline-flex h-8 min-w-[4.25rem] items-center justify-center px-2 text-center text-[8px] leading-snug tracking-[0.06em] text-emerald-800 md:h-10 md:min-w-[6.5rem] md:text-[9px]">
          We’ll email you
        </p>
      );
    }
    return (
      <p className="flex h-[52px] flex-1 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 text-center text-sm text-emerald-900">
        We’ll email you when this is back.
      </p>
    );
  }

  // Logged in — one tap, no email field
  if (loggedIn || !open) {
    return (
      <div className={isCard ? 'relative shrink-0' : 'flex flex-1 flex-col gap-2'}>
        <button
          type="button"
          disabled={busy}
          onClick={onPrimaryClick}
          onPointerDown={stop}
          aria-label="Notify me when back in stock"
          className={isCard ? cardBtnClass : defaultBtnClass}
        >
          {busy ? '…' : 'Notify me'}
        </button>
        {error && !open ? (
          <p
            className={
              isCard
                ? 'absolute top-full right-0 mt-1 max-w-[9rem] text-right text-[9px] leading-tight text-burgundy'
                : 'text-xs text-burgundy'
            }
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  // Guest — ask for email
  if (isCard) {
    return (
      <form
        onSubmit={onSubmit}
        onClick={stop}
        onPointerDown={stop}
        className="relative z-30 flex h-8 max-w-[11.5rem] shrink-0 items-center gap-1 md:h-10 md:max-w-[13.5rem]"
      >
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email for stock notification"
          className="h-full min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-2.5 text-[10px] text-ink outline-none placeholder:text-ink/35 focus:border-burgundy/40 md:px-3 md:text-[11px]"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex h-full shrink-0 items-center justify-center rounded-full bg-ink px-2.5 text-[8px] tracking-[0.1em] text-ivory uppercase disabled:opacity-60 md:px-3 md:text-[9px]"
        >
          {busy ? '…' : 'Notify'}
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={(e) => {
            stop(e);
            setOpen(false);
            setError('');
          }}
          className="flex h-full w-6 shrink-0 items-center justify-center rounded-full text-[10px] text-ink/45 hover:text-ink md:w-7"
        >
          ✕
        </button>
        {error ? (
          <p className="absolute top-full right-0 mt-1 max-w-[11rem] text-right text-[9px] leading-tight text-burgundy">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full flex-1 space-y-2">
      <input
        type="email"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="w-full rounded-full border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-burgundy/40"
      />
      {error ? <p className="text-xs text-burgundy">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-ink text-[10px] tracking-[0.2em] text-ivory uppercase disabled:opacity-60"
        >
          {busy ? '…' : 'Notify me'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="h-11 rounded-full px-4 text-[10px] tracking-[0.16em] text-ink/55 uppercase"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
