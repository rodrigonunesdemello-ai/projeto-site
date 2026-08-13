import Link from 'next/link'
import { Brand } from '@/components/site/brand'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-12 text-center md:px-6">
        <Brand size="md" href="/" />

        <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Celebrando os talentos que representam cada cidade da Baixada Santista. Cada voto
          transforma reconhecimento em impacto social.
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
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

        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
          © {new Date().getFullYear()} Síntese · Todos os direitos reservados
        </p>
      </div>
    </footer>
  )
}
