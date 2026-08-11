import { createClient } from '@/lib/supabase/server'
import type { Category, Nominee, Region } from '@/lib/data'

export type RegionWithCategories = Region & { categories: Category[] }

type RegionRow = {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  image_url: string | null
}

type NomineeRow = {
  id: string
  name: string
  instagram: string | null
  image_url: string | null
  category_id: string
}

export async function getRegions(): Promise<Region[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, slug, tagline, description, image_url')
    .eq('active', true)
    .order('name')

  if (error || !data) return []

  return (data as RegionRow[]).map((r) => ({
    id: r.slug,
    name: r.name,
    slug: r.slug,
    tagline: r.tagline ?? '',
    image: r.image_url ?? '/placeholder.svg',
    description: r.description ?? undefined,
  }))
}

export async function getRegionBySlug(
  slug: string,
): Promise<RegionWithCategories | null> {
  const supabase = await createClient()

  const { data: regionData, error: regionError } = await supabase
    .from('regions')
    .select('id, name, slug, tagline, description, image_url')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (regionError || !regionData) return null

  const region = regionData as RegionRow
  const regionUuid = region.id

  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('active', true)
    .order('name')

  if (categoriesError || !categoriesData) return null

  const { data: nomineesData, error: nomineesError } = await supabase
    .from('nominees')
    .select('id, name, instagram, image_url, category_id')
    .eq('region_id', regionUuid)
    .eq('active', true)

  if (nomineesError || !nomineesData) return null

  const nomineesByCategory = new Map<string, Nominee[]>()
  for (const n of nomineesData as NomineeRow[]) {
    const list = nomineesByCategory.get(n.category_id) ?? []
    list.push({
      id: n.id,
      name: n.name,
      handle: n.instagram ?? '',
      image: n.image_url ?? '/placeholder.svg',
    })
    nomineesByCategory.set(n.category_id, list)
  }

  const categories: Category[] = (categoriesData as Array<{
    id: string
    name: string
    slug: string
    description: string | null
  }>).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? '',
    nominees: nomineesByCategory.get(c.id) ?? [],
  }))

  return {
    id: region.slug,
    name: region.name,
    slug: region.slug,
    tagline: region.tagline ?? '',
    image: region.image_url ?? '/placeholder.svg',
    description: region.description ?? undefined,
    categories,
  }
}
