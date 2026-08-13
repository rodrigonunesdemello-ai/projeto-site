'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/data'
import { LeadModal, type LeadData } from '@/components/regiao/lead-modal'

type Target = { categoryId: string; nomineeId: string; nomineeName: string }

export function VotingSection({ categories }: { categories: Category[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? '')
  const [modalTarget, setModalTarget] = useState<Target | null>(null)
  const [hasLead, setHasLead] = useState(false)
  // Votos por categoria: categoryId -> nomineeId
  const [votes, setVotes] = useState<Record<string, string>>({})

  const active = useMemo(
    () => categories.find((c) => c.id === activeId) ?? categories[0],
    [categories, activeId],
  )

  function requestVote(categoryId: string, nomineeId: string, nomineeName: string) {
    if (votes[categoryId] === nomineeId) return
    if (hasLead) {
      setVotes((v) => ({ ...v, [categoryId]: nomineeId }))
      return
    }
    setModalTarget({ categoryId, nomineeId, nomineeName })
  }

  function confirmLead(_data: LeadData) {
    if (modalTarget) {
      setVotes((v) => ({ ...v, [modalTarget.categoryId]: modalTarget.nomineeId }))
    }
    setHasLead(true)
    setModalTarget(null)
  }

  if (!active) return null

  return (
    <section id="votacao" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 md:px-6">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-primary">Categorias</span>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-metal-silver md:text-4xl">
          Vote nos destaques
        </h2>
        <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      {/* Seletor de categorias */}
      <div className="mb-10 flex flex-wrap justify-center gap-2.5">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-all',
              c.id === activeId
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {c.name}
            {votes[c.id] && <Check className="ml-1.5 inline size-3.5 text-primary" />}
          </button>
        ))}
      </div>

      <p className="mx-auto mb-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
        {active.description}
      </p>

      {/* Grid de concorrentes */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {active.nominees.map((n) => {
          const voted = votes[active.id] === n.id
          return (
            <div
              key={n.id}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300',
                voted
                  ? 'border-primary shadow-xl shadow-primary/15'
                  : 'border-border/60 hover:border-primary/40',
              )}
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={n.image || '/placeholder.svg'}
                  alt={n.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                {voted && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                    <Check className="size-3" /> Votado
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-serif text-lg font-semibold text-metal-silver">{n.name}</h3>
                <p className="text-xs text-muted-foreground">{n.handle}</p>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Trophy className="size-3.5 text-primary" />
                  {(n.votes + (voted ? 1 : 0)).toLocaleString('pt-BR')} votos
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={() => requestVote(active.id, n.id, n.name)}
                  disabled={voted}
                  className={cn(
                    'mt-4 h-10 w-full',
                    voted
                      ? 'bg-primary/15 text-primary'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {voted ? 'Voto confirmado' : 'Votar'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <LeadModal
        open={Boolean(modalTarget)}
        nomineeName={modalTarget?.nomineeName}
        onClose={() => setModalTarget(null)}
        onConfirm={confirmLead}
      />
    </section>
  )
}
