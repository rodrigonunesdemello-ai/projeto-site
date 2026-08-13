'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader as Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Field = {
  key: 'name' | 'whatsapp' | 'phone' | 'address'
  label: string
  placeholder: string
  type?: string
  inputMode?: 'text' | 'tel'
}

const fields: Field[] = [
  { key: 'name', label: 'Nome completo', placeholder: 'Seu nome completo', type: 'text' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '(13) 90000-0000', type: 'tel', inputMode: 'tel' },
  { key: 'phone', label: 'Telefone', placeholder: '(13) 3000-0000', type: 'tel', inputMode: 'tel' },
  { key: 'address', label: 'Endereço', placeholder: 'Rua, número, bairro e cidade', type: 'text' },
]

export function CadastroForm({
  initialName,
  initialWhatsapp,
  initialPhone,
  initialAddress,
}: {
  initialName: string
  initialWhatsapp: string
  initialPhone: string
  initialAddress: string
}) {
  const router = useRouter()
  const [data, setData] = useState({
    name: initialName,
    whatsapp: initialWhatsapp,
    phone: initialPhone,
    address: initialAddress,
  })
  const [errors, setErrors] = useState<Partial<Record<Field['key'], string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate() {
    const next: Partial<Record<Field['key'], string>> = {}
    if (data.name.trim().length < 3) next.name = 'Informe seu nome completo.'
    const digits = (v: string) => v.replace(/\D/g, '')
    if (digits(data.whatsapp).length < 10) next.whatsapp = 'WhatsApp inválido.'
    if (digits(data.phone).length < 10) next.phone = 'Telefone inválido.'
    if (data.address.trim().length < 6) next.address = 'Informe um endereço completo.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setServerError('Sessão expirada. Faça login novamente.')
      setSubmitting(false)
      router.push('/login')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: data.name.trim(),
        whatsapp: data.whatsapp.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        registration_complete: true,
      })
      .eq('id', user.id)

    if (profileError) {
      setServerError('Não foi possível salvar. Tente novamente.')
      setSubmitting(false)
      return
    }

    await supabase
      .from('voters')
      .upsert({
        user_id: user.id,
        name: data.name.trim(),
        whatsapp: data.whatsapp.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
      }, { onConflict: 'user_id' })

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

      {serverError && (
        <span className="text-center text-sm text-destructive">{serverError}</span>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="mt-2 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Salvando...
          </>
        ) : (
          'Finalizar cadastro'
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" />
        Seus dados são protegidos e usados apenas para o sorteio.
      </p>
    </form>
  )
}
