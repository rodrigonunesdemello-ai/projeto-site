'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Loader as Loader2, Tags } from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  active: boolean
}

type FormData = {
  name: string
  slug: string
  description: string
  active: boolean
}

const emptyForm: FormData = { name: '', slug: '', description: '', active: true }

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories((data ?? []) as Category[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', active: c.active })
    setFormError('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!form.slug.trim()) { setFormError('Slug é obrigatório.'); return }

    setSaving(true)
    setFormError('')
    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: form.description.trim() || null,
      active: form.active,
    }

    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id)
      if (error) setFormError('Erro ao atualizar: ' + error.message)
    } else {
      const { error } = await supabase.from('categories').insert(payload)
      if (error) setFormError('Erro ao criar: ' + error.message)
    }

    setSaving(false)
    if (!formError) { setShowForm(false); load() }
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Excluir a categoria "${c.name}"? Todos os concorrentes e votos relacionados serão removidos.`)) return
    const supabase = createClient()
    await supabase.from('categories').delete().eq('id', c.id)
    load()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-metal-silver">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerenciar as categorias da votação</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="size-4" /> Nova categoria
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-card/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="mx-auto size-6 animate-spin text-primary" /></td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground"><Tags className="mx-auto mb-2 size-8 opacity-40" />Nenhuma categoria encontrada.</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', c.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                      {c.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Pencil className="size-4" /></button>
                      <button onClick={() => handleDelete(c)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>
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
              <h2 className="font-serif text-xl font-semibold text-metal-silver">{editing ? 'Editar categoria' : 'Nova categoria'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">Nome *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="form-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">Slug *</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="ex: influenciador" className="form-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="form-textarea" />
              </div>
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
        .form-input { height: 2.5rem; border-radius: 0.5rem; border: 1px solid var(--border); background: color-mix(in oklch, var(--background) 60%, transparent); padding: 0 0.75rem; font-size: 0.875rem; color: var(--foreground); outline: none; }
        .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in oklch, var(--primary) 30%, transparent); }
        .form-textarea { border-radius: 0.5rem; border: 1px solid var(--border); background: color-mix(in oklch, var(--background) 60%, transparent); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--foreground); outline: none; resize: vertical; }
        .form-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in oklch, var(--primary) 30%, transparent); }
      `}</style>
    </div>
  )
}
