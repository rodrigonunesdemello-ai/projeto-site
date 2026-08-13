import { Gift, Smartphone, Trophy } from 'lucide-react'

const prizes = [
  {
    icon: Smartphone,
    title: 'Smartphone Premium',
    description: 'Um smartphone de última geração para o sorteado entre todos os votantes.',
  },
  {
    icon: Gift,
    title: 'Vales-Presente',
    description: 'Diversos vales-presente de estabelecimentos parceiros da região.',
  },
  {
    icon: Trophy,
    title: 'Troféu Síntese',
    description: 'Os vencedores de cada categoria recebem o troféu oficial do prêmio.',
  },
]

export function PrizeCard() {
  return (
    <section id="premios" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 md:px-6">
      <div className="mb-12 flex flex-col items-center text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-primary">Recompensas</span>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-metal-silver md:text-4xl">
          Prêmios para votantes
        </h2>
        <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {prizes.map((p) => (
          <div
            key={p.title}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/40"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <p.icon className="size-6 text-primary" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-metal-silver">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
