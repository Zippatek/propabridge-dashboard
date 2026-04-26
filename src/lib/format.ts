export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60_000
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${Math.floor(diffMin)}m ago`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
  return `${Math.floor(diffMin / 1440)}d ago`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function scoreClass(score: number | null | undefined): string {
  const s = score ?? 0
  if (s >= 80) return 'bg-verified-light text-verified'
  if (s >= 50) return 'bg-gold-light text-[#5d3e02]'
  return 'bg-danger-light text-danger'
}

export function statusClass(status: string | null | undefined): string {
  switch ((status || '').toLowerCase()) {
    case 'new':
      return 'bg-action-light text-action'
    case 'contacted':
    case 'pending':
      return 'bg-gold-light text-[#5d3e02]'
    case 'viewing_scheduled':
    case 'scheduled':
    case 'confirmed':
      return 'bg-verified-light text-verified'
    case 'converted':
    case 'completed':
      return 'bg-verified-light text-verified'
    case 'cancelled':
    case 'dead':
      return 'bg-danger-light text-danger'
    default:
      return 'bg-beige text-subtle'
  }
}

export function formatNaira(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—'
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(n)) return String(amount)
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
