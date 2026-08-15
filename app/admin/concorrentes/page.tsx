'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, Pencil, Trash2, X, Loader as Loader2, CircleUser as UserCircle, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type Nominee = {
  id: string
  name: string
  instagram: string | null
  image_url: string | null
  active: boolean
  region_id: string
  category_id: string
}

type Option = { id: string; name: string }

type FormData = {
  name: string
  instagram: string
  image_url: string
  active: boolean
  region_id: string
  category_id: string
}

const emptyForm: FormData = {
  name: '',
  instagram: '',
  image_url: '',
  active: true,
  region_id: '',
  category_id: '',
}

export default function ConcorrentesPage() {
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [regions, setRegions] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editing, setEditing] = useState<Nominee | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('nominees')
      .select('id, name, instagram, image_url, active, region_id, category_id')
      .order('name')

    if (regionFilter) query = query.eq('region_id', regionFilter)
    if (categoryFilter) query = query.eq('category_id', categoryFilter)

    const { data } = await query
    let result = (data ?? []) as Nominee[]

    if (search) {
      const s = search.toLowerCase()
      result = result.filter((n) => n.name.toLowerCase().includes(s) || (n.instagram ?? '').toLowerCase().includes(s))
    }

    setNominees(result)
    setLoading(false)
  }, [search, regionFilter, categoryFilter])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('regions').select('id, name').order('name'),
      supabase.from('categories').select('id, name').order('name'),
    ]).then(([r, c]) => {
      setRegions((r.data ?? []) as Option[])
      setCategories((c.data ?? []) as Option[])
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(), 300)
    return () => clearTimeout(timer)
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(n: Nominee) {
    setEditing(n)
    setForm({
      name: n.name,
      instagram: n.instagram ?? '',
      image_url: n.image_url ?? '',
      active: n.active,
      region_id: n.region_id,
      category_id: n.category_id,
    })
    setFormError('')
    setShowForm(true)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setFormError('')
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `nominees/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('sintese-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setFormError('Erro ao enviar imagem: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('sintese-images').getPublicUrl(fileName)
    setForm((f) => ({ ...f, image_url: publicUrl }))
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!form.region_id) { setFormError('Região é obrigatória.'); return }
    if (!form.category_id) { setFormError('Categoria é obrigatória.'); return }

    setSaving(true)
    setFormError('')
    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      instagram: form.instagram.trim() || null,
      image_url: form.image_url.trim() || null,
      active: form.active,
      region_id: form.region_id,
      category_id: form.category_id,
    }

    if (editing) {
      const { error } = await supabase.from('nominees').update(payload).eq('id', editing.id)
      if (error) setFormError('Erro ao atualizar: ' + error.message)
    } else {
      const { error } = await supabase.from('nominees').insert(payload)
      if (error) setFormError('Erro ao criar: ' + error.message)
    }

    setSaving(false)
    if (!formError) {
      setShowForm(false)
      load()
    }
  }

  async function handleDelete(n: Nominee) {
    if (!confirm(`Excluir "${n.name}"?`)) return
    const supabase = createClient()
    await supabase.from('nominees').delete().eq('id', n.id)
    load()
  }

  const regionMap = new Map(regions.map((r) => [r.id, r.name]))
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-metal-silver">
            Concorrentes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerenciar todos os concorrentes da votação
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Novo concorrente
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 flex-1 min-w-48">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou Instagram..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="h-10 rounded-lg border border-border/60 bg-card/40 px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Todas as regiões</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-lg border border-border/60 bg-card/40 px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-card/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Instagram</th>
              <th className="px-4 py-3 font-medium">Região</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="mx-auto size-6 animate-spin text-primary" /></td></tr>
            ) : nominees.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground"><UserCircle className="mx-auto mb-2 size-8 opacity-40" />Nenhum concorrente encontrado.</td></tr>
            ) : (
              nominees.map((n) => (
                <tr key={n.id} className="transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-foreground">{n.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.instagram ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{regionMap.get(n.region_id) ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{categoryMap.get(n.category_id) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', n.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                      {n.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(n)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Pencil className="size-4" /></button>
                      <button onClick={() => handleDelete(n)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-metal-silver">
                {editing ? 'Editar concorrente' : 'Novo concorrente'}
              </h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <FormField label="Nome *">
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="form-input" />
              </FormField>

              <FormField label="Instagram">
                <input type="text" value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" className="form-input" />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Região *">
                  <select value={form.region_id} onChange={(e) => setForm((f) => ({ ...f, region_id: e.target.value }))} className="form-input">
                    <option value="">Selecione...</option>
                    {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Categoria *">
                  <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="form-input">
                    <option value="">Selecione...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Imagem">
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40">
                    <Upload className="size-4" />
                    Enviar arquivo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file) }} />
                  </label>
                  {uploading && <Loader2 className="size-4 animate-spin text-primary" />}
                  {form.image_url && <span className="text-xs text-muted-foreground">Imagem carregada</span>}
                </div>
                <input type="text" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="ou cole a URL da imagem" className="form-input mt-2" />
              </FormField>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="size-4 accent-primary" />
                Ativo para votação
              </label>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border/60 px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40">Cancelar</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .form-input {
          height: 2.5rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: color-mix(in oklch, var(--background) 60%, transparent);
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: var(--foreground);
          outline: none;
        }
        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px color-mix(in oklch, var(--primary) 30%, transparent);
        }
      `}</style>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}
