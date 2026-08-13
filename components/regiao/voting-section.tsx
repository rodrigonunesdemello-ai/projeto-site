'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, Trophy, Loader as Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/data'

type Target = { categoryId: string; nomineeId: string; nomineeName: string }

type AuthState = {
  checked: boolean
  userId: string | null
  voterId: string | null
  registrationComplete: boolean
}

export function VotingSection({
  regionUuid,
  categories,
}: {
  regionUuid: string
  categories: Category[]
}) {
  const router = useRouter()
  const [activeId, setActiveId] = useState(categories[0]?.id ?? '')
  const [modalTarget, setModalTarget] = useState<Target | null>(null)
  const [votes, setVotes] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [voteError, setVoteError] = useState('')
  const [auth, setAuth] = useState<AuthState>({
    checked: false,
    userId: null,
    voterId: null,
    registrationComplete: false,
  })

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setAuth({ checked: true, userId: null, voterId: null, registrationComplete: false })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('registration_complete')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.registration_complete) {
        if (!cancelled) setAuth({ checked: true, userId: user.id, voterId: null, registrationComplete: false })
        return
      }

      const { data: voter } = await supabase
        .from('voters')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cancelled) {
        setAuth({
          checked: true,
          userId: user.id,
          voterId: voter?.id ?? null,
          registrationComplete: true,
        })
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const active = useMemo(
    () => categories.find((c) => c.id === activeId) ?? categories[0],
    [categories, activeId],
  )

  async function requestVote(categoryId: string, nomineeId: string, nomineeName: string) {
    if (votes[categoryId] === nomineeId) return
    setVoteError('')

    if (!auth.checked) return

    if (!auth.userId) {
      router.push(`/login?next=/regiao/${regionUuid}`)
      return
    }

    if (!auth.registrationComplete) {
      router.push('/cadastro')
      return
    }

    if (!auth.voterId) {
      setVoteError('Erro ao identificar eleitor. Tente recarregar a página.')
      return
    }

    const cat = categories.find((c) => c.id === categoryId)
    if (!cat) return

    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('register_vote', {
      p_voter_id: auth.voterId,
      p_region_id: regionUuid,
      p_category_id: cat.uuid,
      p_nominee_id: nomineeId,
    })

    if (error) {
      setVoteError('Erro ao registrar voto. Tente novamente.')
      setSubmitting(false)
      return
    }

    if (data?.success) {
      setVotes((v) => ({ ...v, [categoryId]: nomineeId }))
    } else if (data?.code === 'ALREADY_VOTED') {
      setVotes((v) => ({ ...v, [categoryId]: nomineeId }))
      setVoteError('Você já votou nesta categoria para esta região.')
    } else {
      setVoteError(data?.message ?? 'Erro ao registrar voto.')
    }
    setSubmitting(false)
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

      {!auth.checked ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : !auth.userId ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
          <Trophy className="mx-auto size-10 text-primary" />
          <h3 className="mt-4 font-serif text-xl font-semibold text-metal-silver">
            Faça login para votar
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Você precisa estar logado para registrar seus votos e concorrer aos prêmios.
          </p>
          <Button
            size="lg"
            className="mt-6 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push(`/login?next=/regiao/${regionUuid}`)}
          >
            Entrar na Síntese
          </Button>
        </div>
      ) : !auth.registrationComplete ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
          <Trophy className="mx-auto size-10 text-primary" />
          <h3 className="mt-4 font-serif text-xl font-semibold text-metal-silver">
            Complete seu cadastro
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Precisamos de alguns dados adicionais antes de você começar a votar.
          </p>
          <Button
            size="lg"
            className="mt-6 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push('/cadastro')}
          >
            Completar cadastro
          </Button>
        </div>
      ) : (
        <>
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

          {voteError && (
            <p className="mx-auto mb-6 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              {voteError}
            </p>
          )}

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

                    <Button
                      type="button"
                      size="lg"
                      onClick={() => requestVote(active.id, n.id, n.name)}
                      disabled={voted || submitting}
                      className={cn(
                        'mt-4 h-10 w-full',
                        voted
                          ? 'bg-primary/15 text-primary'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                    >
                      {voted ? 'Voto confirmado' : submitting ? 'Registrando...' : 'Votar'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
