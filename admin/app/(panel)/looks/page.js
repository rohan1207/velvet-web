'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import LookEditor from '@/components/LookEditor';
import { money } from '@/lib/format';

const EMPTY = {
  eyebrow: 'The edit',
  title: 'Shop the Complete Look',
  line: 'Tap the lights on each look — then open the matching set beside it.',
  looks: [
    { id: 'look-1', title: 'Look 1', line: '', image: '', alt: '', hotspots: [] },
    { id: 'look-2', title: 'Look 2', line: '', image: '', alt: '', hotspots: [] },
  ],
  featuredSetSlugs: ['', ''],
};

export default function LooksPage() {
  const [form, setForm] = useState(EMPTY);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [lookRes, setsRes] = await Promise.all([
          fetch('/api/complete-look', { credentials: 'same-origin' }),
          fetch('/api/sets', { credentials: 'same-origin' }),
        ]);
        const lookData = await lookRes.json().catch(() => ({}));
        const setsData = await setsRes.json().catch(() => ({}));
        if (cancelled) return;
        if (!lookRes.ok) throw new Error(lookData.error || 'Could not load section');
        const data = lookData.data || EMPTY;
        const looks = [...(data.looks || [])];
        while (looks.length < 2) {
          looks.push({
            id: `look-${looks.length + 1}`,
            title: `Look ${looks.length + 1}`,
            line: '',
            image: '',
            alt: '',
            hotspots: [],
          });
        }
        const featured = [...(data.featuredSetSlugs || [])];
        while (featured.length < 2) featured.push('');
        setForm({
          eyebrow: data.eyebrow || EMPTY.eyebrow,
          title: data.title || EMPTY.title,
          line: data.line || EMPTY.line,
          looks: looks.slice(0, 2),
          featuredSetSlugs: featured.slice(0, 2),
        });
        setSets(Array.isArray(setsData.sets) ? setsData.sets : []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'Could not load. Run npm run db:migrate if the complete-look table is missing.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setsBySlug = useMemo(() => {
    const map = new Map();
    for (const s of sets) map.set(s.slug, s);
    return map;
  }, [sets]);

  function patchLook(index, nextLook) {
    setForm((prev) => {
      const looks = [...prev.looks];
      looks[index] = nextLook;
      return { ...prev, looks };
    });
  }

  function setFeaturedSlug(index, slug) {
    setForm((prev) => {
      const featuredSetSlugs = [...prev.featuredSetSlugs];
      featuredSetSlugs[index] = slug;
      return { ...prev, featuredSetSlugs };
    });
  }

  async function onSave() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/complete-look', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          ...form,
          featuredSetSlugs: form.featuredSetSlugs.filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMessage('Saved — homepage will show this complete look.');
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setError(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#7a736c]">Loading complete look…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-label text-[10px] text-[#d4af64]">Homepage</p>
          <h1 className="font-display mt-2 text-4xl">Shop the Complete Look</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#7a736c]">
            Curate the two model looks (radiating dots → products) and the two set cards shown
            beside them. Showcase jewellery sets and the pieces within each set.
          </p>
        </div>
        <button type="button" className="btn-primary" disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save section'}
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      ) : null}

      <div className="card space-y-4 p-5 md:p-6">
        <p className="font-label text-[10px] text-[#7a736c]">Section copy</p>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-xs text-[#7a736c]">Eyebrow</span>
            <input
              className="input mt-1"
              value={form.eyebrow}
              onChange={(e) => setForm((p) => ({ ...p, eyebrow: e.target.value }))}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs text-[#7a736c]">Title</span>
            <input
              className="input mt-1"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-[#7a736c]">Supporting line</span>
          <input
            className="input mt-1"
            value={form.line}
            onChange={(e) => setForm((p) => ({ ...p, line: e.target.value }))}
          />
        </label>
      </div>

      <div className="card space-y-4 p-5 md:p-6">
        <div>
          <p className="font-label text-[10px] text-[#d4af64]">Set cards (right side)</p>
          <h2 className="font-display mt-1 text-2xl">Featured sets</h2>
          <p className="mt-1 text-sm text-[#7a736c]">
            Pick two jewellery sets to show beside the looks. Prices and images come from Sets.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((index) => {
            const slug = form.featuredSetSlugs[index] || '';
            const selected = setsBySlug.get(slug);
            return (
              <div
                key={`set-slot-${index}`}
                className="rounded-2xl border border-[#2d2b2b]/10 bg-[#faf7f2] p-4"
              >
                <p className="font-label text-[10px] text-[#7a736c]">Set card {index + 1}</p>
                <select
                  className="input mt-2"
                  value={slug}
                  onChange={(e) => setFeaturedSlug(index, e.target.value)}
                >
                  <option value="">Select a set…</option>
                  {sets.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {selected ? (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-[#2d2b2b]/8">
                      {selected.heroUrl || selected.image ? (
                        <Image
                          src={selected.heroUrl || selected.image}
                          alt=""
                          fill
                          className="object-contain p-1"
                          sizes="56px"
                          unoptimized
                        />
                      ) : null}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{selected.name}</p>
                      <p className="font-num text-xs text-[#7a736c]">
                        {money(selected.price)}
                        {Array.isArray(selected.items)
                          ? ` · ${selected.items.length} pcs`
                          : Array.isArray(selected.members)
                            ? ` · ${selected.members.length} pcs`
                            : ''}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {form.looks.map((look, index) => (
          <LookEditor
            key={look.id || index}
            look={look}
            slotLabel={`Look ${index + 1} · model image`}
            onChange={(next) => patchLook(index, next)}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <button type="button" className="btn-primary" disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </div>
  );
}
