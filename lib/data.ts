export type Nominee = {
  id: string
  name: string
  handle: string
  image: string
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
  slug: string
  tagline: string
  image: string
  description?: string
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
