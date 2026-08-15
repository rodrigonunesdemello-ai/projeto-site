import type { Metadata } from 'next'
import { AdminGuard } from '@/components/admin/admin-guard'

export const metadata: Metadata = {
  title: 'Admin — Síntese 2026',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminGuard>{children}</AdminGuard>
}
