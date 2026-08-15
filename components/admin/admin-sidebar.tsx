'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChartBar as BarChart3, Users, Vote, Trophy, CircleUser as UserCircle, Tags, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/eleitores', label: 'Eleitores', icon: Users },
  { href: '/admin/votos', label: 'Votos', icon: Vote },
  { href: '/admin/ranking', label: 'Ranking', icon: Trophy },
  { href: '/admin/concorrentes', label: 'Concorrentes', icon: UserCircle },
  { href: '/admin/categorias', label: 'Categorias', icon: Tags },
  { href: '/admin/regioes', label: 'Regiões', icon: MapPin },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
