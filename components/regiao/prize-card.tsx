import Image from 'next/image'
import { Award, Trophy } from 'lucide-react'
import { prize } from '@/lib/data'

export function PrizeCard() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="overflow-hidden rounded-3xl border border-primary/25 bg-card shadow-2xl shadow-primary/10">
        {/* Banner grande no topo */}
        <div className="relative aspect-[16/7] w-full md:aspect-[16/5]">
          <Image
            src={prize.banner || '/placeholder.svg'}
            alt={prize.title}
            fill
            sizes="(max-width: 1024px) 100vw, 1152px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 md:p-10">
            <span className="flex items-center gap-2 rounded-full border border-primary/40 bg-background/60 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-primary backdrop-blur-sm">
              <Award className="size-4" />
              {prize.edition}
            </span>
            <h2 className="max-w-2xl text-balance font-serif text-3xl font-semibold leading-tight text-metal-silver md:text-5xl">
              {prize.title}
            </h2>
          </div>
        </div>

        {/* Descrição detalhada */}
        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-3 md:p-10">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Trophy className="size-5" />
              <span className="text-xs uppercase tracking-[0.3em]">O grande prêmio</span>
            </div>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground">
              {prize.description}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {prize.highlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-xl border border-border/60 bg-background/40 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">{h.label}</p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{h.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Patrocinador oficial */}
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {prize.sponsor.role}
              </p>
              <div className="mt-4 flex items-center justify-center rounded-xl border border-border/50 bg-background/60 p-5">
                <div className="relative h-16 w-full">
                  <Image
                    src={prize.sponsor.logo || '/placeholder.svg'}
                    alt={prize.sponsor.name}
                    fill
                    sizes="240px"
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Uma realização em parceria com{' '}
              <span className="font-medium text-foreground">{prize.sponsor.name}</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
