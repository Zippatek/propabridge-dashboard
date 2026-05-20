'use client'

import { useState } from 'react'
import { Loader2, Trash2, Upload, ShieldCheck, FileText } from 'lucide-react'
import type { ClientFinding, TitleDocVerificationResult } from '@/lib/verification/findings'

interface TitleFormSnapshot {
  title_type?: string | null
  title_file_no?: string | null
  title_holder_name?: string | null
  title_issuing_authority?: string | null
  title_issued_date?: string | null
}

interface Props {
  initial: string[]
  // Called whenever the document list changes. Parent persists via the main
  // listing PATCH so we don't need a dedicated endpoint yet.
  onChange: (docs: string[]) => void
  // Snapshot of the title fields entered on the form, used by the verify
  // endpoint to compute mismatches.
  titleSnapshot: TitleFormSnapshot
}

export function TitleDocumentManager({ initial, onChange, titleSnapshot }: Props) {
  const [docs, setDocs] = useState<string[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [verifyingIdx, setVerifyingIdx] = useState<number | null>(null)
  const [results, setResults] = useState<Record<number, TitleDocVerificationResult>>({})
  const [err, setErr] = useState<string | null>(null)

  const update = (next: string[]) => {
    setDocs(next)
    onChange(next)
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setErr(null)
    try {
      const next = [...docs]
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          credentials: 'same-origin',
          body: fd,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Upload failed (${res.status})`)
        }
        const { url } = await res.json()
        next.push(url)
      }
      update(next)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const remove = (i: number) => {
    update(docs.filter((_, j) => j !== i))
    setResults(prev => {
      const next = { ...prev }
      delete next[i]
      return next
    })
  }

  const verifyDoc = async (i: number) => {
    setVerifyingIdx(i)
    setErr(null)
    try {
      const res = await fetch('/api/admin/verify-title-doc', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentUrl: docs[i], titleSnapshot }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Verification failed (${res.status})`)
      setResults(prev => ({ ...prev, [i]: json as TitleDocVerificationResult }))
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setVerifyingIdx(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-caption text-subtle font-semibold">Title documents (C of O, R of O, etc.)</span>
      </div>
      <div className="space-y-2">
        {docs.map((url, i) => {
          const result = results[i]
          const isVerifying = verifyingIdx === i
          return (
            <div key={url + i} className="border border-divider rounded-input bg-white p-2.5 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-14 rounded bg-beige border border-divider overflow-hidden flex items-center justify-center flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Doc ${i + 1}`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-body-sm text-navy hover:text-action truncate block"
                  >
                    Document {i + 1}
                  </a>
                  <p className="text-caption text-subtle truncate">{url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => verifyDoc(i)}
                  disabled={isVerifying}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-caption font-semibold bg-beige border border-divider text-subtle hover:text-action hover:border-action transition-colors disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={11} className="animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={11} /> Verify
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1.5 rounded text-subtle hover:text-danger transition-colors"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {result && <VerificationResultCard result={result} />}
            </div>
          )
        })}
        <label
          className={`flex items-center justify-center gap-2 rounded-input border-2 border-dashed py-3 cursor-pointer transition-colors ${
            uploading
              ? 'border-action bg-action-light/20 opacity-60'
              : 'border-divider hover:border-action hover:bg-beige/30'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="text-action animate-spin" />
              <span className="text-caption text-subtle">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={14} className="text-subtle" />
              <span className="text-caption text-subtle">Upload C of O / title document (image)</span>
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={e => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {err && <p className="text-[11px] text-danger mt-2">{err}</p>}
    </div>
  )
}

function VerificationResultCard({ result }: { result: TitleDocVerificationResult }) {
  const { extraction, findings } = result
  return (
    <div className="bg-beige/60 rounded p-2.5 space-y-2 border border-divider">
      <div className="flex items-center gap-1.5">
        <FileText size={11} className="text-subtle" />
        <span className="text-caption text-subtle font-semibold">Extracted from document</span>
        <span className="text-[10px] text-placeholder ml-auto">
          confidence {(extraction.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <KV label="File no." value={extraction.file_number} />
        <KV label="Plot no." value={extraction.plot_number} />
        <KV label="Holder" value={extraction.holder_name} />
        <KV label="Authority" value={extraction.issuing_authority} />
        <KV label="Issued" value={extraction.issued_date} />
        <KV label="Type" value={extraction.title_type} />
      </div>
      {extraction.tampering_signals.length > 0 && (
        <div className="text-[11px] text-warning">
          <span className="font-semibold">Tampering signals:</span> {extraction.tampering_signals.join(', ')}
        </div>
      )}
      {findings.length > 0 && (
        <ul className="space-y-1 pt-1 border-t border-divider/60">
          {findings.map((f, i) => (
            <FindingRow key={i} f={f} />
          ))}
        </ul>
      )}
    </div>
  )
}

function KV({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-placeholder">{label}:</span>
      <span className="text-navy truncate">{value || '—'}</span>
    </div>
  )
}

function FindingRow({ f }: { f: ClientFinding }) {
  const sevColor =
    f.severity === 'block' ? 'bg-danger-light text-danger'
    : f.severity === 'flag' ? 'bg-warning-light text-warning'
    : 'bg-beige text-subtle'
  return (
    <li className="flex items-start gap-1.5 text-[11px]">
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${sevColor}`}>
        {f.severity}
      </span>
      <span className="text-navy">{f.message}</span>
    </li>
  )
}
