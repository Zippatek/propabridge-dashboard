'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Server, RefreshCw } from 'lucide-react'
import { be } from '@/lib/client-api'

interface Health {
  status?: string
  uptime?: number
  [key: string]: unknown
}

export default function AdminSettingsPage() {
  const [adkStatus, setAdkStatus] = useState<'checking' | 'ok' | 'down'>('checking')
  const [beHealth, setBeHealth] = useState<Health | 'down' | 'checking'>('checking')

  const ping = async () => {
    setAdkStatus('checking')
    setBeHealth('checking')
    try {
      const r = await fetch('/api/admin/adk/overview', { credentials: 'same-origin' })
      setAdkStatus(r.ok ? 'ok' : 'down')
    } catch {
      setAdkStatus('down')
    }
    try {
      const v = await be.get<Health>('/health')
      setBeHealth(v)
    } catch {
      setBeHealth('down')
    }
  }

  useEffect(() => {
    ping()
  }, [])

  const Pill = ({ ok, label }: { ok: boolean; label: string }) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge text-caption font-semibold ${
        ok ? 'bg-verified-light text-verified' : 'bg-danger-light text-danger'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-verified animate-pulse-dot' : 'bg-danger'}`}
      />
      {label}
    </span>
  )

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-card border border-divider shadow-card p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-action" strokeWidth={1.8} />
            <h2 className="text-h4 text-navy">Backend connectivity</h2>
          </div>
          <button
            onClick={ping}
            className="flex items-center gap-2 text-body-sm font-semibold text-subtle hover:text-navy bg-beige hover:bg-beige-dark px-3 py-2 rounded-button"
          >
            <RefreshCw size={14} strokeWidth={1.8} />
            Re-check
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-card bg-beige/40 border border-divider">
            <div>
              <p className="font-semibold text-navy">propabridge-adk</p>
              <p className="text-caption text-subtle">FastAPI · AI agent + WhatsApp templates</p>
            </div>
            {adkStatus === 'checking' ? (
              <span className="text-caption text-subtle">Checking…</span>
            ) : (
              <Pill ok={adkStatus === 'ok'} label={adkStatus === 'ok' ? 'Online' : 'Unreachable'} />
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-card bg-beige/40 border border-divider">
            <div>
              <p className="font-semibold text-navy">propabridge-backend</p>
              <p className="text-caption text-subtle">Express · listings, leads, scheduler</p>
            </div>
            {beHealth === 'checking' ? (
              <span className="text-caption text-subtle">Checking…</span>
            ) : (
              <Pill ok={beHealth !== 'down'} label={beHealth !== 'down' ? 'Online' : 'Unreachable'} />
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-gold" strokeWidth={1.8} />
          <h2 className="text-h4 text-navy">Admin session</h2>
        </div>
        <p className="text-body-sm text-subtle">
          You are signed in with the admin dashboard key. Session is httpOnly-cookie based and
          expires after 7 days of inactivity.
        </p>
        <p className="text-caption text-subtle mt-2">
          Sign out from the bottom-left avatar in the sidebar to end the session immediately.
        </p>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card p-6">
        <h2 className="text-h4 text-navy mb-3">Environment</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
          <div>
            <dt className="text-caption text-subtle">PROPA_ADK_BASE</dt>
            <dd className="font-mono text-navy break-all">
              {process.env.NEXT_PUBLIC_PROPA_ADK_BASE || '(server-only)'}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-subtle">PROPA_BACKEND_BASE</dt>
            <dd className="font-mono text-navy break-all">
              {process.env.NEXT_PUBLIC_PROPA_BACKEND_BASE || '(server-only)'}
            </dd>
          </div>
        </dl>
        <p className="text-caption text-subtle mt-3">
          Base URLs and admin keys are configured in <code className="font-mono">.env</code> on the
          dashboard server. See <code className="font-mono">.env.example</code> for the full list.
        </p>
      </section>
    </div>
  )
}
