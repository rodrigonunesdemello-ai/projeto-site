'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { exportToCsv } from '@/lib/csv'
import { Download, Loader as Loader2, Trophy, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

type RankingRow = {
  nominee_name: string
  instagram: string | null
  region_name: string
  category_name: string
  vote_count: number
}

export default function RankingPage() {
  const [rows, setRows] = useState<RankingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [regionFilter, setRegionFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [{ data: regionsData }, { data: categoriesData }] = await Promise.all([
        supabase.from('regions').select('id, name').order('name'),
        supabase.from('categories').select('id, name').order('name'),
      ])
      setRegions(regionsData ?? [])
      setCategories(categoriesData ?? [])
    }

    load()
  }, [])

  useEffect(() => {
    const supabase = createClient()

    async function loadRanking() {
      setLoading(true)

      let voteQuery = supabase
        .from('votes')
        .select('nominee_id, nominee:nominees(name, instagram, region_id, category_id)')

      if (regionFilter || categoryFilter) {
        const nomineeQuery = supabase.from('nominees').select('id')
        if (regionFilter) nomineeQuery.eq('region_id', regionFilter)
        if (categoryFilter) nomineeQuery.eq('category_id', categoryFilter)
        const { data: nomineeIds } = await nomineeQuery
        const ids = (nomineeIds ?? []).map((n) => n.id)
        if (ids.length === 0) {
          setRows([])
          setLoading(false)
          return
        }
        voteQuery = voteQuery.in('nominee_id', ids)
      }

      const { data: votesData } = await voteQuery

      const regionMap = new Map(regions.map((r) => [r.id, r.name]))
      const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

      const counts = new Map<string, RankingRow>()
      for (const v of votesData ?? []) {
        const nominee = v.nominee as { name: string; instagram: string | null; region_id: string; category_id: string } | null
        if (!nominee) continue
        const key = `${nominee.name}-${nominee.region_id}-${nominee.category_id}`
        const existing = counts.get(key)
        if (existing) {
          existing.vote_count++
        } else {
          counts.set(key, {
            nominee_name: nominee.name,
            instagram: nominee.instagram,
            region_name: regionMap.get(nominee.region_id) ?? '—',
            category_name: categoryMap.get(nominee.category_id) ?? '—',
            vote_count: 1,
          })
        }
      }

      const sorted = Array.from(counts.values()).sort((a, b) => b.vote_count - a.vote_count)
      setRows(sorted)
      setLoading(false)
    }

    if (regions.length > 0 || categories.length > 0 || (!regionFilter && !categoryFilter)) {
      loadRanking()
    }
  }, [regionFilter, categoryFilter, regions, categories])

  function handleExport() {
    exportToCsv('ranking-sintese.csv', [
      { header: 'Posição', accessor: (_r: RankingRow, i: number) => i + 1 },
      { header: 'Concorrente', accessor: (r: RankingRow) => r.nominee_name },
      { header: 'Instagram', accessor: (r: RankingRow) => r.instagram ?? '' },
      { header: 'Região', accessor: (r: RankingRow) => r.region_name },
      { header: 'Categoria', accessor: (r: RankingRow) => r.category_name },
      { header: 'Votos', accessor: (r: RankingRow) => r.vote_count },
    ], rows.map((r, i) => ({ ...r, _idx: i })) as unknown as RankingRow[])
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-metal-silver">
            Ranking
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Classificação real baseada nos votos registrados
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-50"
        >
          <Download className="size-4" />
          Exportar CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="h-10 rounded-lg border border-border/60 bg-card/40 px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Todas as regiões</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-lg border border-border/60 bg-card/40 px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-card/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Concorrente</th>
              <th className="px-4 py-3 font-medium">Instagram</th>
              <th className="px-4 py-3 font-medium">Região</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 text-right font-medium">Votos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Trophy className="mx-auto mb-2 size-8 opacity-40" />
                  Nenhum voto registrado ainda.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={`${row.nominee_name}-${row.region_name}-${row.category_name}`} className="transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full text-xs font-bold',
                        i === 0 && 'bg-primary/20 text-primary',
                        i === 1 && 'bg-muted/60 text-foreground',
                        i === 2 && 'bg-accent text-foreground',
                        i > 2 && 'text-muted-foreground',
                      )}
                    >
                      {i < 3 ? <Medal className="size-4" /> : i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.nominee_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.instagram ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.region_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.category_name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{row.vote_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
