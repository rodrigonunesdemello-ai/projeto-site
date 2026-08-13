import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CadastroForm } from '@/components/auth/cadastro-form'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { Brand } from '@/components/site/brand'

export default async function CadastroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, whatsapp, phone, address, registration_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.registration_complete) redirect('/')

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Brand size="md" />
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-8 shadow-2xl shadow-primary/5">
            <div className="mb-8 text-center">
              <span className="text-xs uppercase tracking-[0.3em] text-primary">
                Quase lá
              </span>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-metal-silver">
                Complete seu cadastro
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Precisamos de alguns dados adicionais para registrar seus votos e garantir sua
                participação no sorteio.
              </p>
            </div>

            <CadastroForm
              initialName={profile?.name ?? ''}
              initialWhatsapp={profile?.whatsapp ?? ''}
              initialPhone={profile?.phone ?? ''}
              initialAddress={profile?.address ?? ''}
            />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
