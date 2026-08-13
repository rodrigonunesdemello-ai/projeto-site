import Link from 'next/link'
import { Trophy } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15">
            <Trophy className="size-5 text-primary" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-wide text-metal-silver">
            SÍNTESE<span className="text-primary"> 2026</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#regioes"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Regiões
          </Link>
          <Link
            href="/#sobre"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sobre
          </Link>
          <Link
            href="/#premios"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Prêmios
          </Link>
        </nav>

        <Link
          href="/#regioes"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Votar agora
        </Link>
      </div>
    </header>
  )
}
