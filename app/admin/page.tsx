'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Vote, CircleUser as UserCircle, MapPin, Tags, Loader as Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Stats = {
  totalVotes: number
  totalVoters: number
  totalNominees: number
  totalRegions: number
  totalCategories: number
  votesByRegion: { name: string; count: number }[]
  votesByCategory: { name: string; count: number }[]
}

type StatCard = {
  label: string
  value: number
  icon: typeof Users
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [
        { count: totalVotes },
        { count: totalVoters },
        { count: totalNominees },
        { count: totalRegions },
        { count: totalCategories },
      ] = await Promise.all([
        supabase.from('votes').select('*', { count: 'exact', head: true }),
        supabase.from('voters').select('*', { count: 'exact', head: true }),
        supabase.from('nominees').select('*', { count: 'exact', head: true }),
        supabase.from('regions').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
      ])

      const { data: votesData } = await supabase
        .from('votes')
        .select('region_id, category_id')

      const { data: regions } = await supabase
        .from('regions')
        .select('id, name')

      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')

      const regionMap = new Map(regions?.map((r) => [r.id, r.name]) ?? [])
      const categoryMap = new Map(categories?.map((c) => [c.id, c.name]) ?? [])

      const votesByRegion = new Map<string, number>()
      const votesByCategory = new Map<string, number>()

      for (const v of votesData ?? []) {
        votesByRegion.set(v.region_id, (votesByRegion.get(v.region_id) ?? 0) + 1)
        votesByCategory.set(v.category_id, (votesByCategory.get(v.category_id) ?? 0) + 1)
      }

      setStats({
        totalVotes: totalVotes ?? 0,
        totalVoters: totalVoters ?? 0,
        totalNominees: totalNominees ?? 0,
        totalRegions: totalRegions ?? 0,
        totalCategories: totalCategories ?? 0,
        votesByRegion: Array.from(votesByRegion.entries())
          .map(([id, count]) => ({ name: regionMap.get(id) ?? '—', count }))
          .sort((a, b) => b.count - a.count),
        votesByCategory: Array.from(votesByCategory.entries())
          .map(([id, count]) => ({ name: categoryMap.get(id) ?? '—', count }))
          .sort((a, b) => b.count - a.count),
      })
      setLoading(false)
    }

    load()
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const cards: StatCard[] = [
    { label: 'Total de votos', value: stats.totalVotes, icon: Vote },
    { label: 'Eleitores', value: stats.totalVoters, icon: Users },
    { label: 'Concorrentes', value: stats.totalNominees, icon: UserCircle },
    { label: 'Regiões', value: stats.totalRegions, icon: MapPin },
    { label: 'Categorias', value: stats.totalCategories, icon: Tags },
  ]

  const maxRegion = Math.max(...stats.votesByRegion.map((r) => r.count), 1)
  const maxCategory = Math.max(...stats.votesByCategory.map((c) => c.count), 1)

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-metal-silver">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Visão geral da votação Síntese 2026
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border/60 bg-card/40 p-5"
          >
            <card.icon className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-semibold text-foreground">
              {card.value.toLocaleString('pt-BR')}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Votos por região" data={stats.votesByRegion} max={maxRegion} />
        <ChartCard title="Votos por categoria" data={stats.votesByCategory} max={maxCategory} />
      </div>
    </div>
  )
}

function ChartCard({
  title,
  data,
  max,
}: {
  title: string
  data: { name: string; count: number }[]
  max: number
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum voto registrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                {item.name}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-muted/40">
                <div
                  className={cn(
                    'h-7 rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all',
                  )}
                  style={{ width: `${Math.max((item.count / max) * 100, 4)}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-medium text-foreground">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
