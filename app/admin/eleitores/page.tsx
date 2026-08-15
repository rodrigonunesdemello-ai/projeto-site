'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { exportToCsv } from '@/lib/csv'
import { Search, Download, Loader as Loader2, Users } from 'lucide-react'

type Voter = {
  id: string
  name: string
  whatsapp: string | null
  phone: string | null
  address: string | null
  created_at: string
}

const PAGE_SIZE = 50

export default function EleitoresPage() {
  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const load = useCallback(async (pageNum: number, searchTerm: string) => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('voters')
      .select('id, name, whatsapp, phone, address, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    }

    const { data, count } = await query
    setVoters((data ?? []) as Voter[])
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
    exportToCsv('eleitores-sintese.csv', [
      { header: 'Nome', accessor: (r: Voter) => r.name },
      { header: 'WhatsApp', accessor: (r: Voter) => r.whatsapp ?? '' },
      { header: 'Telefone', accessor: (r: Voter) => r.phone ?? '' },
      { header: 'Endereço', accessor: (r: Voter) => r.address ?? '' },
      { header: 'Cadastro', accessor: (r: Voter) => new Date(r.created_at).toLocaleString('pt-BR') },
    ], voters)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-metal-silver">
            Eleitores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString('pt-BR')} eleitor{total !== 1 ? 'es' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={voters.length === 0}
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
          placeholder="Buscar por nome, WhatsApp ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-card/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Endereço</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                </td>
              </tr>
            ) : voters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 size-8 opacity-40" />
                  Nenhum eleitor encontrado.
                </td>
              </tr>
            ) : (
              voters.map((voter) => (
                <tr key={voter.id} className="transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-foreground">{voter.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{voter.whatsapp ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{voter.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{voter.address ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(voter.created_at).toLocaleDateString('pt-BR')}
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
