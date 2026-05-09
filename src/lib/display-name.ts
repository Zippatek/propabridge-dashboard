/** Match ADK admin priority: name → full_name → profile_name → phone → Unknown */

export function displayLeadLabel(lead: {
  name?: string | null
  full_name?: string | null
  profile_name?: string | null
  phone?: string | null
}): string {
  const parts = [lead.name, lead.full_name, lead.profile_name, lead.phone]
  for (const raw of parts) {
    if (raw == null) continue
    const s = String(raw).trim()
    if (!s) continue
    const low = s.toLowerCase()
    if (low === 'guest user' || low === 'unknown') continue
    return s
  }
  return 'Unknown'
}
