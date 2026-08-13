import { createClient } from '@/lib/supabase/server'
import type { Region, RegionWithCategories, Category, Nominee } from '@/lib/data'

type RegionRow = {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  image_url: string | null
}

type CategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
}

type NomineeRow = {
  id: string
  name: string
  instagram: string | null
  image_url: string | null
  category_id: string
}

export async function getRegions(): Promise<Region[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, slug, tagline, description, image_url')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return (data as RegionRow[]).map((r) => ({
    id: r.slug,
    uuid: r.id,
    name: r.name,
    slug: r.slug,
    tagline: r.tagline ?? '',
    image: r.image_url ?? '/placeholder.svg',
    description: r.description ?? undefined,
  }))
}

export async function getRegionBySlug(slug: string): Promise<RegionWithCategories | null> {
  const supabase = createClient()

  const { data: region, error: regionError } = await supabase
    .from('regions')
    .select('id, name, slug, tagline, description, image_url')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (regionError || !region) return null

  const r = region as RegionRow

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (catError || !categories) return null

  const { data: nominees, error: nomError } = await supabase
    .from('nominees')
    .select('id, name, instagram, image_url, category_id')
    .eq('region_id', r.id)
    .eq('active', true)
    .order('name', { ascending: true })

  if (nomError || !nominees) return null

  const nomRows = nominees as NomineeRow[]

  const cats: Category[] = (categories as CategoryRow[]).map((c) => ({
    id: c.slug,
    uuid: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? '',
    nominees: nomRows
      .filter((n) => n.category_id === c.id)
      .map((n) => ({
        id: n.id,
        name: n.name,
        handle: n.instagram ?? '',
        image: n.image_url ?? '/placeholder.svg',
      })),
  }))

  return {
    id: r.slug,
    uuid: r.id,
    name: r.name,
    slug: r.slug,
    tagline: r.tagline ?? '',
    image: r.image_url ?? '/placeholder.svg',
    description: r.description ?? undefined,
    categories: cats,
  }
}
