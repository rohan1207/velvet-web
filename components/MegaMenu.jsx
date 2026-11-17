'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import ResponsiveBannerImage from '@/components/ResponsiveBannerImage';

const shopMenu = {
  eyebrow: 'Shop',
  line: 'Browse by form, collection, or house edit.',
  exploreHref: '/shop',
  exploreLabel: 'Shop all',
  columns: [
    {
      title: 'Categories',
      links: [
        { href: '/shop?category=earrings', label: 'Earrings' },
        { href: '/shop?category=bracelets', label: 'Bracelets' },
        { href: '/shop?category=necklaces', label: 'Necklaces' },
        { href: '/shop?category=pendants', label: 'Pendants' },
        // { href: '/shop?category=chokers', label: 'Chokers' },
        { href: '/shop?category=accessories', label: 'Accessories' },
        { href: '/shop?category=rings', label: 'Rings' },
        { href: '/shop?category=anklets', label: 'Anklets' },
        { href: '/shop?category=sets', label: 'Sets' },
        { href: '/shop', label: 'Shop all' },
      ],
    },
    {
      title: 'Collections',
      links: [
        { href: '/shop?collection=lotus-whispers', label: 'Lotus Whispers' },
        { href: '/shop?collection=honey-atelier', label: 'Honey Atelier' },
        { href: '/shop?collection=soft-rain-garden', label: 'Soft Rain Garden' },
        { href: '/shop?collection=garden-path', label: 'Garden Path' },
        { href: '/shop?collection=butterfly-meadow', label: 'Butterfly Meadow' },
        { href: '/shop?collection=bamboo-grove', label: 'Bamboo Grove' },
        { href: '/shop?collection=plum-blossom', label: 'Plum Blossom' },
        { href: '/shop?collection=the-shell-edit', label: 'The Shell Edit' },
      ],
    },
    {
      title: 'Edits',
      links: [
        { href: '/#festive-edit', label: 'Festive Edit' },
        { href: '/#best-of', label: 'Best of Velvet Shell' },
        { href: '/wishlist', label: 'Saved pieces' },
        { href: '/shop', label: 'New arrivals' },
      ],
    },
  ],
  features: [
    {
      href: '/shop?category=pendants',
      image: '/images/banners/pendants/monstera-leaf.jpg',
      label: 'Pendants',
      note: 'A single quiet focus',
    },
    {
      href: '/shop?category=necklaces',
      image: '/images/banners/necklaces/pinecone.jpg',
      label: 'Necklaces',
      note: 'Worn at the collarbone',
    },
    {
      href: '/shop?category=accessories',
      image: '/images/banners/chains/gold-chain.jpg',
      label: 'Accessories',
      note: 'Brooches, chains & chokers',
    },
    {
      href: '/shop?category=earrings',
      image: '/images/banners/earrings/honeybee.jpg',
      label: 'Earrings',
      note: 'Nature at the ear',
    },
  ],
};

const giftingMenu = {
  layout: 'split',
  eyebrow: 'Gifting',
  line: 'Thoughtful pieces for occasions, houses and teams.',
  exploreHref: '/gifting',
  exploreLabel: 'Explore gifting',
  columns: [
    {
      title: 'Gifting',
      links: [
        { href: '/gifting', label: 'Corporate gifting' },
        { href: '/shop?category=sets', label: 'Gift sets' },
        { href: '/shop', label: 'Shop all' },
        { href: '/contact', label: 'Enquire' },
      ],
    },
    {
      title: 'Gift ideas',
      links: [
        { href: '/shop?category=earrings', label: 'Earrings' },
        { href: '/shop?category=bracelets', label: 'Bracelets' },
        { href: '/shop?category=necklaces', label: 'Necklaces' },
        { href: '/shop?category=rings', label: 'Rings' },
        { href: '/shop?category=sets', label: 'Sets' },
      ],
    },
    {
      title: 'Occasions',
      links: [
        { href: '/gifting', label: 'Corporate' },
        { href: '/shop?category=sets', label: 'Wedding & sets' },
        { href: '/#festive-edit', label: 'Festive edit' },
        { href: '/contact', label: 'Custom enquire' },
      ],
    },
  ],
  features: [
    {
      href: '/gifting',
      image: '/images/category-banner-gifting.jpg',
      label: 'Corporate',
      note: 'Curated for teams',
    },
    {
      href: '/shop?category=sets',
      image: '/images/banners/sets/daisy-chain-set.jpg',
      label: 'Gift sets',
      note: 'Pieces meant together',
    },
    {
      href: '/shop?category=necklaces',
      image: '/images/banners/necklaces/pomegranate.jpg',
      label: 'Necklaces',
      note: 'Worn close',
    },
  ],
};

const accessoriesMenu = {
  layout: 'tiles',
  eyebrow: 'Accessories',
  line: 'Brooches, chains, and chokers — finishing pieces with presence.',
  exploreHref: '/shop?category=accessories',
  exploreLabel: 'Browse accessories',
  columns: [
    {
      title: 'Accessories',
      links: [
        { href: '/shop?category=accessories', label: 'All accessories' },
        { href: '/shop?category=chains', label: 'Chains & chokers' },
        { href: '/shop?category=brooches', label: 'Brooches' },
      ],
    },
  ],
  features: [
    {
      href: '/shop?category=accessories',
      image: '/images/banners/chains/gold-chain.jpg',
      label: 'All accessories',
      note: 'Brooches, chains & chokers',
    },
    {
      href: '/shop?category=chains',
      image: '/images/banners/chains/gold-chain.jpg',
      label: 'Chains & chokers',
      note: 'Fine links for everyday layering',
    },
    {
      href: '/shop?category=brooches',
      image: '/images/banners/brooches/gold-silver-flower.jpg',
      label: 'Brooches',
      note: 'Pinned to lapel or dress',
    },
  ],
};

const brandMenu = {
  layout: 'directory',
  eyebrow: 'Brand',
  line: 'The story, the journal, and how we care for each piece.',
  exploreHref: '/about',
  exploreLabel: 'About us',
  columns: [
    {
      title: 'The brand',
      links: [
        { href: '/about', label: 'About us' },
        { href: '/blogs', label: 'Blogs' },
        { href: '/testimonials', label: 'Testimonials' },
        { href: '/contact', label: 'Contact us' },
        { href: '/faq', label: 'FAQs' },
      ],
    },
    {
      title: 'Policies',
      links: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms & Conditions' },
        { href: '/returns', label: 'Returns, Exchanges & Refunds' },
        { href: '/shipping', label: 'Shipping' },
      ],
    },
    {
      title: 'Visit',
      links: [
        { href: '/lookbook', label: 'Lookbook' },
        { href: '/wishlist', label: 'Saved pieces' },
        { href: '/account', label: 'Account' },
        { href: '/shop', label: 'Shop the edit' },
      ],
    },
  ],
  features: [
    {
      href: '/about',
      image: '/images/banners/home-hero/lotus-story.jpg',
      label: 'About us',
      note: 'Our story',
    },
    {
      href: '/blogs',
      image: '/images/banners/home-hero/floral-whispers.jpg',
      label: 'Journal',
      note: 'Materials, shipping, care',
    },
    {
      href: '/testimonials',
      image: '/images/testimonials/review-packaging-unbox.jpg',
      label: 'Testimonials',
      note: 'Customer photos & reviews',
    },
  ],
};

function PanelHeader({ menu, onNavigate }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="font-label text-[10px] tracking-[0.22em] text-gold uppercase">{menu.eyebrow}</p>
        <p className="mt-1 max-w-md text-sm font-light leading-snug text-ink/70">{menu.line}</p>
      </div>
      <Link
        href={menu.exploreHref || '/shop'}
        onClick={onNavigate}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-velvet-texture px-4 py-2 font-label text-[10px] tracking-[0.16em] text-ivory uppercase transition-opacity hover:opacity-90"
      >
        {menu.exploreLabel || 'Explore'}
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

function LinkColumns({ columns, onNavigate }) {
  const cols =
    columns.length > 2 ? 'sm:grid-cols-3' : columns.length === 2 ? 'sm:grid-cols-2' : 'grid-cols-1';
  return (
    <div className={`mt-4 grid gap-x-6 gap-y-4 ${cols}`}>
      {columns.map((col) => (
        <div key={col.title}>
          <p className="font-label text-[10px] tracking-[0.18em] text-ink/40 uppercase">{col.title}</p>
          <ul className="mt-1.5">
            {col.links.map((link) => (
              <li key={`${col.title}-${link.label}`}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[13.5px] font-light text-ink/85 transition-colors hover:bg-pearl hover:text-burgundy"
                >
                  <span>{link.label}</span>
                  <span aria-hidden className="text-[12px] text-ink/25 transition-colors group-hover:text-burgundy">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PhotoCard({ feature, onNavigate, className = '' }) {
  return (
    <Link
      href={feature.href}
      onClick={onNavigate}
      className={`group relative block min-h-[9.5rem] overflow-hidden rounded-2xl bg-pearl ${className}`}
    >
      <ResponsiveBannerImage
        src={feature.image}
        alt=""
        sizes="(max-width: 1024px) 50vw, 28vw"
        className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/15 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-3.5">
        <span className="font-label text-[10px] tracking-[0.16em] text-ivory uppercase">{feature.label}</span>
        {feature.note ? (
          <span className="mt-1 block text-[12px] font-light leading-snug text-ivory/80">{feature.note}</span>
        ) : null}
      </span>
    </Link>
  );
}

function MegaPanel({ menu, onNavigate }) {
  const shell = 'mx-auto w-full max-w-[1600px] px-5 py-5 md:px-8 lg:px-10 lg:py-6';

  if (menu.layout === 'tiles') {
    return (
      <div className="bg-ivory">
        <div className={shell}>
          <PanelHeader menu={menu} onNavigate={onNavigate} />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {menu.features.map((feature) => (
              <PhotoCard key={feature.label} feature={feature} onNavigate={onNavigate} className="aspect-[16/10]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (menu.layout === 'directory') {
    const lead = menu.features[0];
    return (
      <div className="bg-ivory">
        <div className={`${shell} grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.72fr)] lg:gap-8`}>
          <div className="min-w-0">
            <PanelHeader menu={menu} onNavigate={onNavigate} />
            <LinkColumns columns={menu.columns} onNavigate={onNavigate} />
          </div>
          {lead ? (
            <PhotoCard feature={lead} onNavigate={onNavigate} className="aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[13rem]" />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory">
      <div className={`${shell} grid items-start gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8`}>
        <div className="min-w-0">
          <PanelHeader menu={menu} onNavigate={onNavigate} />
          <LinkColumns columns={menu.columns} onNavigate={onNavigate} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {menu.features.slice(0, 2).map((feature) => (
            <PhotoCard key={feature.label} feature={feature} onNavigate={onNavigate} className="aspect-[4/3]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MegaMenu({ open, onOpen, onClose }) {
  const menu =
    open === 'shop'
      ? shopMenu
      : open === 'brand'
        ? brandMenu
        : open === 'gifting'
          ? giftingMenu
          : open === 'accessories'
            ? accessoriesMenu
            : null;

  return (
    <AnimatePresence>
      {menu && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-30 cursor-default bg-ink/30 backdrop-blur-[1px]"
            style={{ top: 'var(--site-chrome-offset)' }}
            onClick={onClose}
            onMouseEnter={onClose}
          />
          <motion.div
            key={open}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full z-40 max-h-[58vh] overflow-x-hidden overflow-y-auto border-t border-ink/6 shadow-[0_18px_40px_rgba(40,20,24,0.12)]"
            onMouseEnter={() => onOpen(open)}
            onMouseLeave={onClose}
          >
            <MegaPanel menu={menu} onNavigate={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { shopMenu, brandMenu, giftingMenu, accessoriesMenu };
