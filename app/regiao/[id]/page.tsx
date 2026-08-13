import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { PrizeCard } from '@/components/regiao/prize-card'
import { VotingSection } from '@/components/regiao/voting-section'
import { getRegionBySlug, getRegions } from '@/lib/queries'

export async function generateStaticParams() {
  const regions = await getRegions()
  return regions.map((region) => ({ id: region.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const region = await getRegionBySlug(id)
  if (!region) return { title: 'Região não encontrada — Síntese' }
  return {
    title: `${region.name} — Votação Síntese`,
    description: `Vote nos talentos que representam ${region.name}. ${region.tagline}.`,
  }
}

export default async function RegionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const region = await getRegionBySlug(id)
  if (!region) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={region.image || '/placeholder.svg'}
              alt={`Vista de ${region.name}`}
              fill
              sizes="100vw"
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
            <Link
              href="/#regioes"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              Voltar às regiões
            </Link>

            <div className="mt-8 flex flex-col items-center text-center">
              <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-primary">
                <MapPin className="size-3.5" />
                {region.tagline}
              </span>
              <h1 className="mt-6 font-serif text-4xl font-semibold text-metal-silver md:text-6xl">
                {region.name}
              </h1>
              <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
                Escolha uma categoria e vote nos talentos que representam o melhor de {region.name}.
                Cada voto conta e concorre a prêmios exclusivos.
              </p>
            </div>
          </div>
        </section>

        <PrizeCard />
        <VotingSection regionId={region.id} categories={region.categories} />
      </main>

      <SiteFooter />
    </div>
  )
}
