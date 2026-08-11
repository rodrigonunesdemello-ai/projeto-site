/*
# Create regions, categories, and nominees tables with seed data

1. New Tables
- `regions`: id, name, slug (unique), tagline, description, image_url, active, created_at
- `categories`: id, name, slug (unique), description, active, created_at
- `nominees`: id, region_id (FK), category_id (FK), name, instagram, image_url, active, created_at

2. Seed Data
- 6 regions (Santos, Guarujá, São Vicente, Praia Grande, Cubatão, Bertioga)
- 5 categories (Influenciador do Ano, Lojista Destaque, Gastronomia Destaque,
  Beleza & Estética, Revelação do Ano)
- 4 nominees per category per region = 120 nominees total
  Names generated deterministically from first/last name pools.

3. Security
- RLS enabled on all three tables.
- SELECT: public (anon + authenticated) reads active records only.
- INSERT/UPDATE/DELETE: admin only (profiles.role = 'admin').
*/

CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  tagline text,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS nominees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  instagram text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_nominees_region ON nominees(region_id);
CREATE INDEX IF NOT EXISTS idx_nominees_category ON nominees(category_id);
CREATE INDEX IF NOT EXISTS idx_nominees_region_category ON nominees(region_id, category_id);

-- Seed: regions
INSERT INTO regions (name, slug, tagline, image_url) VALUES
  ('Santos', 'santos', 'O coração da Baixada', '/regions/santos.png'),
  ('Guarujá', 'guaruja', 'A pérola do litoral', '/regions/guaruja.png'),
  ('São Vicente', 'sao-vicente', 'A cidade primeira', '/regions/sao-vicente.png'),
  ('Praia Grande', 'praia-grande', 'Energia à beira-mar', '/regions/praia-grande.png'),
  ('Cubatão', 'cubatao', 'Entre a serra e o mar', '/regions/cubatao.png'),
  ('Bertioga', 'bertioga', 'Natureza e tradição', '/regions/bertioga.png')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  image_url = EXCLUDED.image_url;

-- Seed: categories
INSERT INTO categories (name, slug, description) VALUES
  ('Influenciador do Ano', 'influenciador', 'As vozes que inspiram e movimentam a cidade nas redes.'),
  ('Lojista Destaque', 'lojista', 'O comércio local que encanta pelo atendimento e experiência.'),
  ('Gastronomia Destaque', 'gastronomia', 'Os sabores que definem a identidade da região.'),
  ('Beleza & Estética', 'beleza', 'Profissionais que elevam a autoestima com excelência.'),
  ('Revelação do Ano', 'revelacao', 'Os novos talentos que estão conquistando o público.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Seed: nominees (4 per category per region = 120 total)
-- Uses hashtext() for deterministic but varied name selection per region+category.
DO $$
DECLARE
  r RECORD;
  c RECORD;
  first_names text[] := ARRAY['Ana','Bruno','Camila','Diego','Elisa','Felipe','Gabi','Henrique'];
  last_names text[] := ARRAY['Ribeiro','Costa','Almeida','Nunes','Santos','Oliveira','Moraes','Prado'];
  avatar_paths text[] := ARRAY['/nominees/n1.png','/nominees/n2.png','/nominees/n3.png','/nominees/n4.png','/nominees/n5.png','/nominees/n6.png'];
  ni int;
  h int;
  first text;
  last text;
  nom_name text;
  handle text;
  avatar text;
BEGIN
  FOR r IN SELECT id, slug FROM regions LOOP
    FOR c IN SELECT id, slug FROM categories LOOP
      FOR ni IN 0..3 LOOP
        h := hashtext(r.slug || c.slug || ni::text);
        first := first_names[1 + ((h % 8 + 8) % 8)];
        last := last_names[1 + (((h / 8) % 8 + 8) % 8)];
        nom_name := first || ' ' || last;
        handle := '@' || lower(first) || '.' || lower(last);
        avatar := avatar_paths[1 + (ni % 6)];
        INSERT INTO nominees (region_id, category_id, name, instagram, image_url)
        VALUES (r.id, c.id, nom_name, handle, avatar)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- RLS: public read of active records
DROP POLICY IF EXISTS "regions_select_active_public" ON regions;
CREATE POLICY "regions_select_active_public"
ON regions FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "categories_select_active_public" ON categories;
CREATE POLICY "categories_select_active_public"
ON categories FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "nominees_select_active_public" ON nominees;
CREATE POLICY "nominees_select_active_public"
ON nominees FOR SELECT
TO anon, authenticated
USING (active = true);

-- Admin-only writes
DROP POLICY IF EXISTS "regions_insert_admin" ON regions;
CREATE POLICY "regions_insert_admin"
ON regions FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "regions_update_admin" ON regions;
CREATE POLICY "regions_update_admin"
ON regions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "regions_delete_admin" ON regions;
CREATE POLICY "regions_delete_admin"
ON regions FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin"
ON categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin"
ON categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin"
ON categories FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "nominees_insert_admin" ON nominees;
CREATE POLICY "nominees_insert_admin"
ON nominees FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "nominees_update_admin" ON nominees;
CREATE POLICY "nominees_update_admin"
ON nominees FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "nominees_delete_admin" ON nominees;
CREATE POLICY "nominees_delete_admin"
ON nominees FOR DELETE TO authenticated USING (public.is_admin());
