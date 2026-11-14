-- Homepage "Shop the Complete Look" — look images + hotspots + featured set cards

create table if not exists public.homepage_complete_look (
  id text primary key default 'default' check (id = 'default'),
  eyebrow text not null default 'The edit',
  title text not null default 'Shop the Complete Look',
  line text not null default 'Tap the lights on each look — then open the matching set beside it.',
  -- [{ id, title, line, image, alt, hotspots: [{ id, productSlug, x, y }] }]
  looks jsonb not null default '[]'::jsonb,
  -- Ordered set slugs for the two promo cards on the right
  featured_set_slugs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.homepage_complete_look enable row level security;

drop policy if exists "Public read homepage complete look" on public.homepage_complete_look;
create policy "Public read homepage complete look"
  on public.homepage_complete_look for select
  using (true);

insert into public.homepage_complete_look (
  id,
  eyebrow,
  title,
  line,
  looks,
  featured_set_slugs
)
values (
  'default',
  'The edit',
  'Shop the Complete Look',
  'Tap the lights on each look — then open the matching set beside it.',
  '[
    {
      "id": "pearl-fairy-set",
      "title": "Pearl fringed look",
      "line": "Necklace and bracelet — one quiet language.",
      "image": "/images/look-pearl-set-v2.jpg",
      "alt": "Model wearing the Fairy-Like Fringed pearl collarbone chain and matching bracelet",
      "hotspots": [
        {
          "id": "necklace",
          "productSlug": "fairy-like-fringed-collarbone-chain-with-heart-shaped-pearl-bead-nck-016",
          "x": 48,
          "y": 58
        },
        {
          "id": "bracelet",
          "productSlug": "fairy-like-fringed-bracelet-with-heart-shaped-pearl-bead-brc-028",
          "x": 57,
          "y": 48
        }
      ]
    },
    {
      "id": "daisy-chain-set",
      "title": "Daisy chain look",
      "line": "Necklace, ring and bracelet — worn together.",
      "image": "/images/look-daisy-set-v2.jpg",
      "alt": "Model wearing the Daisy necklace, ring and bracelet set with fine chain links",
      "hotspots": [
        {
          "id": "necklace",
          "productSlug": "daisy-necklace-with-fine-chain-links-ywje0076",
          "x": 51,
          "y": 45
        },
        {
          "id": "ring",
          "productSlug": "daisy-ring-with-fine-chain-links-ywje0077",
          "x": 33,
          "y": 52
        },
        {
          "id": "bracelet",
          "productSlug": "daisy-bracelet-with-fine-chain-links-ywje0075",
          "x": 39,
          "y": 71
        }
      ]
    }
  ]'::jsonb,
  '[
    "fairy-like-fringed-collarbone-chain-bracelet-with-heart-shaped-pearl-bea",
    "daisy-necklace-ring-bracelet-set-with-fine-chain-links-s02"
  ]'::jsonb
)
on conflict (id) do nothing;

insert into public.schema_migrations (id) values ('015_homepage_complete_look')
on conflict (id) do nothing;
