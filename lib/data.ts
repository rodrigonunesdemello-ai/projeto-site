export type Nominee = {
  id: string
  name: string
  handle: string
  image: string
  votes: number
}

export type Category = {
  id: string
  name: string
  description: string
  nominees: Nominee[]
}

export type Region = {
  id: string
  name: string
  tagline: string
  image: string
  categories: Category[]
}

const avatars = [
  '/nominees/n1.png',
  '/nominees/n2.png',
  '/nominees/n3.png',
  '/nominees/n4.png',
  '/nominees/n5.png',
  '/nominees/n6.png',
]

// Gera um conjunto padrão de categorias para cada cidade,
// com nomes de concorrentes fictícios e contagens de votos.
function buildCategories(seed: string): Category[] {
  const templates: Omit<Category, 'nominees'>[] = [
    {
      id: 'influenciador',
      name: 'Influenciador do Ano',
      description: 'As vozes que inspiram e movimentam a cidade nas redes.',
    },
    {
      id: 'lojista',
      name: 'Lojista Destaque',
      description: 'O comércio local que encanta pelo atendimento e experiência.',
    },
    {
      id: 'gastronomia',
      name: 'Gastronomia Destaque',
      description: 'Os sabores que definem a identidade da região.',
    },
    {
      id: 'beleza',
      name: 'Beleza & Estética',
      description: 'Profissionais que elevam a autoestima com excelência.',
    },
    {
      id: 'revelacao',
      name: 'Revelação do Ano',
      description: 'Os novos talentos que estão conquistando o público.',
    },
  ]

  const firstNames = ['Ana', 'Bruno', 'Camila', 'Diego', 'Elisa', 'Felipe', 'Gabi', 'Henrique']
  const lastNames = ['Ribeiro', 'Costa', 'Almeida', 'Nunes', 'Santos', 'Oliveira', 'Moraes', 'Prado']

  return templates.map((tpl, ci) => ({
    ...tpl,
    nominees: Array.from({ length: 4 }).map((_, ni) => {
      const idx = (ci * 4 + ni) % firstNames.length
      const first = firstNames[(idx + seed.length) % firstNames.length]
      const last = lastNames[(idx + ci) % lastNames.length]
      const name = `${first} ${last}`
      return {
        id: `${tpl.id}-${ni}`,
        name,
        handle: `@${first.toLowerCase()}.${last.toLowerCase()}`,
        image: avatars[(ci * 4 + ni) % avatars.length],
        votes: 120 + ((ci * 37 + ni * 53 + seed.length * 11) % 880),
      }
    }),
  }))
}

const baseRegions: Omit<Region, 'categories'>[] = [
  { id: 'santos', name: 'Santos', tagline: 'O coração da Baixada', image: '/regions/santos.png' },
  { id: 'guaruja', name: 'Guarujá', tagline: 'A pérola do litoral', image: '/regions/guaruja.png' },
  {
    id: 'sao-vicente',
    name: 'São Vicente',
    tagline: 'A cidade primeira',
    image: '/regions/sao-vicente.png',
  },
  {
    id: 'praia-grande',
    name: 'Praia Grande',
    tagline: 'Energia à beira-mar',
    image: '/regions/praia-grande.png',
  },
  { id: 'cubatao', name: 'Cubatão', tagline: 'Entre a serra e o mar', image: '/regions/cubatao.png' },
  {
    id: 'bertioga',
    name: 'Bertioga',
    tagline: 'Natureza e tradição',
    image: '/regions/bertioga.png',
  },
]

export const regions: Region[] = baseRegions.map((r) => ({
  ...r,
  categories: buildCategories(r.id),
}))

export function getRegion(id: string): Region | undefined {
  return regions.find((r) => r.id === id)
}

export type Prize = {
  title: string
  edition: string
  banner: string
  description: string
  highlights: { label: string; value: string }[]
  sponsor: {
    name: string
    logo: string
    role: string
  }
}

export const prize: Prize = {
  title: 'Troféu Síntese de Ouro',
  edition: 'Grande Prêmio — Edição 2026',
  banner: '/prize-banner.png',
  description:
    'O grande vencedor de cada categoria recebe o cobiçado Troféu Síntese de Ouro, além de um pacote de visibilidade premium com produção de conteúdo profissional, campanha de mídia na região e um final de semana de luxo à beira-mar. Cada voto registrado também habilita o eleitor a concorrer a prêmios exclusivos no sorteio oficial da plataforma.',
  highlights: [
    { label: 'Troféu', value: 'Peça exclusiva banhada a ouro' },
    { label: 'Visibilidade', value: 'Campanha de mídia regional' },
    { label: 'Experiência', value: 'Fim de semana de luxo' },
  ],
  sponsor: {
    name: 'Litoral Prime',
    logo: '/sponsor-litoral.png',
    role: 'Patrocinador Oficial',
  },
}
