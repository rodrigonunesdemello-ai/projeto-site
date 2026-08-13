'use client'

import { useEffect, useState } from 'react'
import { X, ShieldCheck, Loader as Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export type LeadData = {
  nome: string
  whatsapp: string
  telefone: string
  endereco: string
}

type Field = {
  key: keyof LeadData
  label: string
  placeholder: string
  type?: string
  inputMode?: 'text' | 'tel'
}

const fields: Field[] = [
  { key: 'nome', label: 'Nome completo', placeholder: 'Seu nome completo', type: 'text' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '(13) 90000-0000', type: 'tel', inputMode: 'tel' },
  { key: 'telefone', label: 'Telefone', placeholder: '(13) 3000-0000', type: 'tel', inputMode: 'tel' },
  { key: 'endereco', label: 'Endereço', placeholder: 'Rua, número, bairro e cidade', type: 'text' },
]

const empty: LeadData = { nome: '', whatsapp: '', telefone: '', endereco: '' }

export function LeadModal({
  open,
  nomineeName,
  onClose,
  onConfirm,
}: {
  open: boolean
  nomineeName?: string
  onClose: () => void
  onConfirm: (voterId: string) => void
}) {
  const [data, setData] = useState<LeadData>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof LeadData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  function validate() {
    const next: Partial<Record<keyof LeadData, string>> = {}
    if (data.nome.trim().length < 3) next.nome = 'Informe seu nome completo.'
    const digits = (v: string) => v.replace(/\D/g, '')
    if (digits(data.whatsapp).length < 10) next.whatsapp = 'WhatsApp inválido.'
    if (digits(data.telefone).length < 10) next.telefone = 'Telefone inválido.'
    if (data.endereco.trim().length < 6) next.endereco = 'Informe um endereço completo.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const supabase = createClient()
      const { data: result, error } = await supabase.rpc('register_voter', {
        p_name: data.nome.trim(),
        p_whatsapp: data.whatsapp.trim(),
        p_phone: data.telefone.trim(),
        p_address: data.endereco.trim(),
      })

      if (error || !result) {
        setSubmitError('Não foi possível registrar seus dados. Tente novamente.')
        setSubmitting(false)
        return
      }

      onConfirm(result as string)
      setData(empty)
      setErrors({})
    } catch {
      setSubmitError('Não foi possível registrar seus dados. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-2xl shadow-primary/10">
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="p-6 md:p-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-5 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
            <span className="sr-only">Fechar</span>
          </button>

          <span className="text-xs uppercase tracking-[0.3em] text-primary">Confirme seu voto</span>
          <h2 id="lead-modal-title" className="mt-2 font-serif text-2xl font-semibold text-metal-silver">
            Falta só um passo
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {nomineeName ? (
              <>
                Para votar em <span className="text-foreground">{nomineeName}</span>, preencha seus
                dados. É rápido e garante sua participação no sorteio.
              </>
            ) : (
              'Preencha seus dados para registrar o voto e concorrer aos prêmios.'
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label htmlFor={f.key} className="text-xs font-medium text-foreground">
                  {f.label} <span className="text-primary">*</span>
                </label>
                <input
                  id={f.key}
                  type={f.type}
                  inputMode={f.inputMode}
                  placeholder={f.placeholder}
                  value={data[f.key]}
                  onChange={(e) => setData((d) => ({ ...d, [f.key]: e.target.value }))}
                  aria-invalid={Boolean(errors[f.key])}
                  className={cn(
                    'h-11 rounded-lg border bg-background/60 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30',
                    errors[f.key] ? 'border-destructive' : 'border-input',
                  )}
                />
                {errors[f.key] && <span className="text-xs text-destructive">{errors[f.key]}</span>}
              </div>
            ))}

            {submitError && <span className="text-xs text-destructive">{submitError}</span>}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="mt-2 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Registrando...
                </>
              ) : (
                'Confirmar voto'
              )}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Seus dados são protegidos e usados apenas para o sorteio.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
