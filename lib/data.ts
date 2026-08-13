export type Region = {
  id: string
  uuid: string
  name: string
  slug: string
  tagline: string
  image: string
  description?: string
}

export type Nominee = {
  id: string
  name: string
  handle: string
  image: string
}

export type Category = {
  id: string
  uuid: string
  name: string
  description: string
  nominees: Nominee[]
}

export type RegionWithCategories = Region & {
  categories: Category[]
}
