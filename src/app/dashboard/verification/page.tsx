'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, Upload } from 'lucide-react'
import { customer } from '@/lib/customer-api'

const WHATSAPP = process.env.NEXT_PUBLIC_PROPA_WHATSAPP_NUMBER || '2348055551300'

export default function VerificationPage() {
  const { data: session } = useSession()
  const status =
    (session?.user as { kyc_status?: string } | undefined)?.kyc_status || 'pending'

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session?.user?.id) return
    setUploading(true)
    setError(null)
    setSuccess(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('user_id', String(session.user.id))
      fd.append('document_type', 'kyc')
      const base = process.env.NEXT_PUBLIC_PROPA_BACKEND_BASE
      const res = await fetch(`${base}/upload`, { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Upload failed (${res.status})`)
      }
      setSuccess(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const StatusCard = () => {
    if (status === 'verified') {
      return (
        <div className="bg-verified-light border border-verified/20 rounded-card p-6 flex items-start gap-4">
          <CheckCircle2 size={24} className="text-verified flex-shrink-0" strokeWidth={1.8} />
          <div>
            <p className="font-semibold text-navy">You&apos;re verified</p>
            <p className="text-body-sm text-subtle mt-1">
              Your KYC is approved. You can transact with full closing rights on Propabridge.
            </p>
          </div>
        </div>
      )
    }
    if (status === 'rejected') {
      return (
        <div className="bg-danger-light border border-danger/20 rounded-card p-6 flex items-start gap-4">
          <AlertCircle size={24} className="text-danger flex-shrink-0" strokeWidth={1.8} />
          <div>
            <p className="font-semibold text-navy">Verification needs attention</p>
            <p className="text-body-sm text-subtle mt-1">
              Your previous submission was not accepted. Please re-upload, or message Propa to
              find out what was missing.
            </p>
          </div>
        </div>
      )
    }
    return (
      <div className="bg-warning-light border border-warning/20 rounded-card p-6 flex items-start gap-4">
        <Clock size={24} className="text-warning flex-shrink-0" strokeWidth={1.8} />
        <div>
          <p className="font-semibold text-navy">Verification pending</p>
          <p className="text-body-sm text-subtle mt-1">
            Submit a government ID and proof of address. Approval is usually within 1 business day.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StatusCard />

      <section className="bg-white rounded-card border border-divider shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-action" strokeWidth={1.8} />
          <h2 className="text-h4 text-navy">What we need</h2>
        </div>
        <ul className="space-y-3 text-body-sm text-navy">
          {[
            'A clear photo of a government-issued ID (NIN, voter card, driver licence, or passport)',
            'A proof of address dated within the last 3 months (utility bill or bank statement)',
            'A selfie holding the same ID, if requested',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-beige text-subtle flex items-center justify-center text-caption font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {status !== 'verified' && (
        <section className="bg-white rounded-card border border-divider shadow-card p-6">
          <h2 className="text-h4 text-navy mb-4">Upload a document</h2>

          <label className="block">
            <span className="sr-only">Upload</span>
            <div
              className={`border-2 border-dashed border-divider rounded-card p-8 text-center cursor-pointer transition-colors ${
                uploading ? 'opacity-60' : 'hover:border-action hover:bg-action-light/30'
              }`}
            >
              <Upload size={32} strokeWidth={1.4} className="text-subtle mx-auto mb-3" />
              <p className="text-body text-navy font-semibold">
                {uploading ? 'Uploading…' : 'Drop a file or click to browse'}
              </p>
              <p className="text-caption text-subtle mt-1">PDF, JPG, or PNG · max 10 MB</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={uploading}
                onChange={onUpload}
                className="hidden"
              />
            </div>
          </label>

          {error && (
            <p className="mt-3 text-caption text-danger flex items-center gap-1.5">
              <AlertCircle size={14} strokeWidth={1.8} />
              {error}
            </p>
          )}
          {success && (
            <p className="mt-3 text-caption text-verified flex items-center gap-1.5">
              <CheckCircle2 size={14} strokeWidth={1.8} />
              Uploaded. We&apos;ll review and update your status shortly.
            </p>
          )}

          <p className="text-caption text-subtle mt-4">
            Prefer WhatsApp?{' '}
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-action font-semibold hover:text-action-hover"
            >
              Send your documents to Propa →
            </a>
          </p>
        </section>
      )}
    </div>
  )
}
