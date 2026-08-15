import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type BrandProps = {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizes = {
  sm: { img: 32, title: 'text-xl', tracking: 'tracking-[0.3em]', sub: 'text-[9px]' },
  md: { img: 44, title: 'text-2xl', tracking: 'tracking-[0.35em]', sub: 'text-[10px]' },
  lg: { img: 88, title: 'text-5xl md:text-6xl', tracking: 'tracking-[0.4em]', sub: 'text-xs' },
}

export function Brand({ size = 'md', href, className }: BrandProps) {
  const s = sizes[size]
  const isLg = size === 'lg'

  const content = (
    <div className={cn('flex items-center gap-3', isLg && 'flex-col gap-4', className)}>
      <span className="relative flex items-center justify-center">
        {isLg && (
          <span className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl" />
        )}
        <Image
          src="/sintese-logo.svg"
          alt="Logotipo Síntese"
          width={s.img}
          height={s.img}
          className="rounded-full ring-1 ring-primary/40"
          priority
        />
      </span>
      <span className="flex flex-col items-start leading-none" style={isLg ? { alignItems: 'center' } : undefined}>
        <span
          className={cn(
            'font-serif font-semibold text-gold-gradient',
            s.title,
            s.tracking,
          )}
        >
          Síntese
        </span>
        <span
          className={cn(
            'mt-1 uppercase text-muted-foreground',
            s.sub,
            isLg ? 'tracking-[0.5em]' : 'tracking-[0.3em]',
          )}
        >
          Baixada Santista
        </span>
      </span>
    </div>
  )

  if (href) {
    return (
      <Link href={href} aria-label="Síntese — página inicial">
        {content}
      </Link>
    )
  }

  return content
}
