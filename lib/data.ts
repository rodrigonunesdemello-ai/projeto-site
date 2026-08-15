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

export type Prize = {
  edition: string
  title: string
  description: string
  banner: string
  highlights: { label: string; value: string }[]
  sponsor: {
    name: string
    role: string
    logo: string
  }
}

export const prize: Prize = {
  edition: 'Edição 2026',
  title: 'Grande Prêmio Síntese 2026',
  description:
    'O Grande Prêmio Síntese celebra os talentos que fazem a Baixada Santista brilhar. Ao votar, você concorre a prêmios exclusivos e ajuda a transformar vidas na sua região.',
  banner: '/placeholder.svg',
  highlights: [
    { label: 'Sorteio', value: '01/12/2026' },
    { label: 'Premiação', value: 'R$ 50.000 em prêmios' },
    { label: 'Participação', value: '6 regiões, 5 categorias' },
  ],
  sponsor: {
    name: 'Síntese',
    role: 'Realização',
    logo: '/placeholder.svg',
  },
}
