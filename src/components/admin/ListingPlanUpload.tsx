'use client'

import { useState } from 'react'
import { Upload, Trash2, Loader2, FileText, ExternalLink } from 'lucide-react'
import { be } from '@/lib/client-api'

export type PlanValue = { url: string | null; fileName: string | null }

function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.pdf')
  } catch {
    return /\.pdf(\?|#|$)/i.test(url)
  }
}

type Props = {
  /** When set, PATCH /listings/:id after each upload or remove. */
  listingId?: string
  planUrl: string | null
  planFileName: string | null
  onPersisted: (next: PlanValue) => void
}

export function ListingPlanUpload({ listingId, planUrl, planFileName, onPersisted }: Props) {
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const persistRemote = async (next: PlanValue) => {
    if (listingId) {
      setSaving(true)
      setErr(null)
      try {
        await be.send(`/listings/${listingId}`, 'PATCH', {
          plan_url: next.url,
          plan_file_name: next.fileName,
        })
        onPersisted(next)
      } catch (e) {
        setErr((e as Error).message)
      } finally {
        setSaving(false)
      }
    } else {
      onPersisted(next)
    }
  }

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload-plan', {
        method: 'POST',
        credentials: 'same-origin',
        body: fd,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`)
      await persistRemote({
        url: json.url as string,
        fileName: (json.fileName as string) || file.name,
      })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const remove = async () => {
    if (!planUrl) return
    if (!confirm('Remove the uploaded floor plan? The public site will hide Download Plan.')) return
    await persistRemote({ url: null, fileName: null })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-caption text-subtle font-semibold">
          Floor plan <span className="text-placeholder">(image or PDF — public Download Plan)</span>
        </span>
        {(uploading || saving) && (
          <span className="text-[10px] text-action flex items-center gap-1">
            <Loader2 size={10} className="animate-spin" />
            {uploading ? 'uploading' : 'saving'}
          </span>
        )}
      </div>

      {planUrl ? (
        <div className="rounded-input border border-divider bg-beige/40 p-2.5 flex items-center gap-3">
          <div className="relative w-16 h-16 rounded overflow-hidden border border-divider bg-white flex items-center justify-center flex-shrink-0">
            {isPdfUrl(planUrl) ? (
              <FileText size={28} className="text-action" strokeWidth={1.6} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={planUrl} alt="Plan preview" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm text-navy font-semibold truncate">{planFileName || 'Uploaded plan'}</p>
            <a
              href={planUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-action hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink size={11} /> Preview
            </a>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                uploading ? 'bg-action/60 text-white opacity-70' : 'bg-action text-white hover:bg-action-hover'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Replacing
                </>
              ) : (
                <>
                  <Upload size={11} /> Replace
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="hidden"
                disabled={uploading || saving}
                onChange={e => {
                  handleFile(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
            <button
              type="button"
              onClick={remove}
              disabled={uploading || saving}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-semibold bg-beige border border-divider text-subtle hover:text-danger hover:border-danger transition-colors disabled:opacity-50"
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center rounded-input border-2 border-dashed py-6 cursor-pointer transition-colors ${
            uploading ? 'border-action bg-action-light/20 opacity-70' : 'border-divider hover:border-action hover:bg-beige/30'
          }`}
        >
          {uploading ? (
            <Loader2 size={22} className="text-action animate-spin mb-1" strokeWidth={1.5} />
          ) : (
            <Upload size={22} className="text-subtle mb-1" strokeWidth={1.5} />
          )}
          <span className="text-body-sm text-subtle font-semibold">{uploading ? 'Uploading…' : 'Upload floor plan'}</span>
          <span className="text-caption text-placeholder mt-0.5">JPEG, PNG, WebP, GIF or PDF · up to 20 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="hidden"
            disabled={uploading || saving}
            onChange={e => {
              handleFile(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      )}

      {err && <p className="text-[11px] text-danger mt-2">{err}</p>}
    </div>
  )
}
