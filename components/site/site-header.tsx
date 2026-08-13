import Link from 'next/link'
import { Brand } from '@/components/site/brand'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Brand size="sm" href="/" />

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link href="/#regioes" className="transition-colors hover:text-foreground">
            Regiões
          </Link>
          <Link href="/#premios" className="transition-colors hover:text-foreground">
            Prêmios
          </Link>
          <Link href="/#impacto" className="transition-colors hover:text-foreground">
            Impacto social
          </Link>
        </nav>

        <Link
          href="/#regioes"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          Votar agora
        </Link>
      </div>
    </header>
  )
}
