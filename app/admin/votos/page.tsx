'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { exportToCsv } from '@/lib/csv'
import { Search, Download, Loader as Loader2, Vote } from 'lucide-react'

type VoteRow = {
  id: string
  created_at: string
  voter_name: string
  region_name: string
  category_name: string
  nominee_name: string
}

const PAGE_SIZE = 50

export default function VotosPage() {
  const [votes, setVotes] = useState<VoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const load = useCallback(async (pageNum: number, searchTerm: string) => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('votes')
      .select(`
        id,
        created_at,
        voter:voters(name),
        region:regions(name),
        category:categories(name),
        nominee:nominees(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (searchTerm) {
      query = query.or(`nominee.name.ilike.%${searchTerm}%,voter.name.ilike.%${searchTerm}%`)
    }

    const { data, count } = await query

    const mapped = (data ?? []).map((v: Record<string, unknown>) => {
      const voter = v.voter as { name: string } | null
      const region = v.region as { name: string } | null
      const category = v.category as { name: string } | null
      const nominee = v.nominee as { name: string } | null
      return {
        id: v.id as string,
        created_at: v.created_at as string,
        voter_name: voter?.name ?? '—',
        region_name: region?.name ?? '—',
        category_name: category?.name ?? '—',
        nominee_name: nominee?.name ?? '—',
      }
    })

    setVotes(mapped)
    setTotal(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0)
      load(0, search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, load])

  function handleExport() {
    exportToCsv('votos-sintese.csv', [
      { header: 'Eleitor', accessor: (r: VoteRow) => r.voter_name },
      { header: 'Região', accessor: (r: VoteRow) => r.region_name },
      { header: 'Categoria', accessor: (r: VoteRow) => r.category_name },
      { header: 'Concorrente', accessor: (r: VoteRow) => r.nominee_name },
      { header: 'Data', accessor: (r: VoteRow) => new Date(r.created_at).toLocaleString('pt-BR') },
    ], votes)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-metal-silver">
            Votos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString('pt-BR')} voto{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={votes.length === 0}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-50"
        >
          <Download className="size-4" />
          Exportar CSV
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por eleitor ou concorrente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-card/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Eleitor</th>
              <th className="px-4 py-3 font-medium">Região</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Concorrente</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                </td>
              </tr>
            ) : votes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Vote className="mx-auto mb-2 size-8 opacity-40" />
                  Nenhum voto encontrado.
                </td>
              </tr>
            ) : (
              votes.map((vote) => (
                <tr key={vote.id} className="transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-foreground">{vote.voter_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{vote.region_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{vote.category_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{vote.nominee_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(vote.created_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setPage(page - 1); load(page - 1, search) }}
              disabled={page === 0}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => { setPage(page + 1); load(page + 1, search) }}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
