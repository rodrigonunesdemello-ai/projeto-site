import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Region } from '@/lib/data'

export function RegionCard({ region }: { region: Region }) {
  return (
    <Link
      href={`/regiao/${region.id}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-border/60 bg-card ring-1 ring-inset ring-white/5 transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
    >
      <Image
        src={region.image || '/placeholder.svg'}
        alt={`Vista de ${region.name}`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
      />

      {/* Gradiente para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

      <div className="relative z-10 flex items-end justify-between gap-3 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            {region.tagline}
          </p>
          <h3 className="mt-1 font-serif text-2xl font-semibold text-metal-silver">
            {region.name}
          </h3>
        </div>

        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowUpRight className="size-5" />
          <span className="sr-only">Ver categorias de {region.name}</span>
        </span>
      </div>
    </Link>
  )
}
