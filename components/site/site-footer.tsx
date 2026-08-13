import Link from 'next/link'
import { Trophy } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
              <Trophy className="size-4 text-primary" />
            </span>
            <span className="font-serif text-base font-semibold tracking-wide text-metal-silver">
              SÍNTESE<span className="text-primary"> 2026</span>
            </span>
          </Link>
          <p className="max-w-md text-sm text-muted-foreground">
            O maior prêmio do litoral paulista. Reconhecendo quem faz a diferença
            na Baixada Santista.
          </p>
          <p className="text-xs text-muted-foreground/60">
            © 2026 Síntese. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
