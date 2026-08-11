import { Gift, HeartHandshake, Sparkles, Award } from 'lucide-react'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { RegionCard } from '@/components/site/region-card'
import { Brand } from '@/components/site/brand'
import { getRegions } from '@/lib/queries'

export default async function HomePage() {
  const regions = await getRegions()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center md:px-6 md:py-28">
            {/* Selo premium */}
            <div className="mx-auto mb-10 flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-primary">
              <Award className="size-4" />
              Edição Premium 2026
            </div>

            {/* Logotipo centralizado */}
            <div className="mb-10 flex justify-center">
              <Brand size="lg" />
            </div>

            <h1 className="mx-auto max-w-3xl text-balance font-serif text-4xl font-semibold leading-tight md:text-6xl">
              <span className="text-metal-silver">Celebre os talentos da </span>
              <span className="text-gold-gradient">sua região</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              Vote nos influenciadores, lojistas e revelações que representam a sua cidade na
              Baixada Santista. A cada voto, você concorre a prêmios e ajuda a transformar vidas
              com doações sociais.
            </p>

            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: Sparkles, label: 'Votação exclusiva', desc: 'Categorias por cidade' },
                { icon: Gift, label: 'Sorteio de prêmios', desc: 'Todo eleitor concorre' },
                { icon: HeartHandshake, label: 'Impacto social', desc: 'Doação de cestas básicas' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-5"
                >
                  <item.icon className="size-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seletor de regiões */}
        <section id="regioes" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 md:px-6">
          <div className="mb-12 flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-primary">Selecione</span>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-metal-silver md:text-4xl">
              Escolha a sua região
            </h2>
            <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((region) => (
              <RegionCard key={region.id} region={region} />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
