import { Pill } from '@/components/ui'

const MAP: Record<string, { label: string; tone: string }> = {
  cleared: { label: 'Cleared', tone: 'completed' },
  cleared_with_warnings: { label: 'Cleared · warning', tone: 'cleared' },
  reported: { label: 'Reported', tone: 'delivered' },
  pending: { label: 'Not cleared', tone: 'documents_pending' },
  rejected: { label: 'Rejected', tone: 'on_hold' },
}

export function ZatcaPill({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, tone: 'draft' }
  return <Pill status={m.tone}>{m.label}</Pill>
}
