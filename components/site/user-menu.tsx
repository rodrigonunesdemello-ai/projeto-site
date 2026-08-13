'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SessionUser = {
  email: string
  name: string
}

export function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        const meta = (u.user_metadata ?? {}) as Record<string, string>
        setUser({
          email: u.email ?? '',
          name: meta.full_name || meta.name || u.email || '',
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = (session.user.user_metadata ?? {}) as Record<string, string>
        setUser({
          email: session.user.email ?? '',
          name: meta.full_name || meta.name || session.user.email || '',
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (loading) {
    return (
      <span className="flex h-9 w-9 items-center justify-center">
        <span className="size-4 animate-pulse rounded-full bg-muted-foreground/40" />
      </span>
    )
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Entrar
      </Link>
    )
  }

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border/60 py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary/40"
      aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initials || <User className="size-4" />}
        </span>
        <span className="hidden max-w-24 truncate text-sm text-foreground sm:block">
          {user.name.split(' ')[0]}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-2xl shadow-primary/10"
        >
          <div className="border-b border-border/40 px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              setUser(null)
              setOpen(false)
              router.push('/')
              router.refresh()
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            role="menuitem"
          >
            <LogOut className="size-4" />
            Sair da conta
          </button>
        </div>
      )}
    </div>
  )
}
