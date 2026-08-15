'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Brand } from '@/components/site/brand'
import { Loader as Loader2, ShieldAlert } from 'lucide-react'

type AdminGuardState = {
  loading: boolean
  isAdmin: boolean
  loggedIn: boolean
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AdminGuardState>({
    loading: true,
    isAdmin: false,
    loggedIn: false,
  })

  useEffect(() => {
    const supabase = createClient()

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({ loading: false, isAdmin: false, loggedIn: false })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      setState({
        loading: false,
        isAdmin: profile?.role === 'admin',
        loggedIn: true,
      })
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check()
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!state.loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto size-12 text-primary" />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-metal-silver">
            Acesso restrito
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você precisa estar logado para acessar a área administrativa.
          </p>
          <button
            onClick={() => router.push('/login?next=/admin')}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Fazer login
          </button>
        </div>
      </div>
    )
  }

  if (!state.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto size-12 text-destructive" />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-metal-silver">
            Acesso negado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você não possui permissão para acessar esta área.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 rounded-lg border border-border/60 bg-card/40 px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
          >
            Voltar para a página inicial
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-border/60 bg-card/30 md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <div className="px-4 py-5">
          <div className="mb-6 px-2">
            <Brand size="sm" href="/admin" />
          </div>
          <AdminSidebar />
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
