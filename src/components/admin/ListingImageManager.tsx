'use client'

import { useRef, useState } from 'react'
import { Loader2, Trash2, Wand2, Check, X, Upload } from 'lucide-react'
import { be } from '@/lib/client-api'

export interface ImageItem {
  url: string
  is_cover: boolean
}

type EnhanceState = null | 'loading' | string

export function ListingImageManager({
  listingId,
  initial,
  onPersisted,
}: {
  listingId: string
  initial: ImageItem[]
  onPersisted: (imgs: ImageItem[]) => void
}) {
  const [items, setItems] = useState<ImageItem[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [enhanceStates, setEnhanceStates] = useState<EnhanceState[]>(() => initial.map(() => null))
  const dragIdx = useRef<number | null>(null)

  const persist = async (next: ImageItem[]) => {
    setEnhanceStates(prev => {
      const padded = [...prev]
      while (padded.length < next.length) padded.push(null)
      return padded.slice(0, next.length)
    })
    setItems(next)
    setSaving(true)
    setErr(null)
    try {
      await be.send(`/listings/${listingId}/images`, 'PUT', { images: next })
      onPersisted(next)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onDragStart = (i: number) => {
    dragIdx.current = i
  }
  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDrop = (i: number) => {
    const from = dragIdx.current
    dragIdx.current = null
    if (from === null || from === i) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    persist(next)
  }

  const setCover = (i: number) => {
    const next = items.map((it, j) => ({ ...it, is_cover: j === i }))
    persist(next)
  }
  const remove = (i: number) => {
    const next = items.filter((_, j) => j !== i)
    if (next.length > 0 && !next.some(it => it.is_cover)) next[0].is_cover = true
    persist(next)
  }

  const enhanceImage = async (i: number) => {
    setEnhanceStates(prev => {
      const n = [...prev]
      n[i] = 'loading'
      return n
    })
    setErr(null)
    try {
      const res = await fetch('/api/admin/enhance-image', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageUrl: items[i].url }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Enhancement failed (${res.status})`)
      setEnhanceStates(prev => {
        const n = [...prev]
        n[i] = json.enhancedImageUrl as string
        return n
      })
    } catch (e) {
      setErr((e as Error).message)
      setEnhanceStates(prev => {
        const n = [...prev]
        n[i] = null
        return n
      })
    }
  }

  const acceptEnhancement = (i: number) => {
    const enhanced = enhanceStates[i]
    if (!enhanced || enhanced === 'loading') return
    const next = items.map((it, j) => (j === i ? { ...it, url: enhanced } : it))
    setEnhanceStates(prev => {
      const n = [...prev]
      n[i] = null
      return n
    })
    persist(next)
  }

  const discardEnhancement = (i: number) => {
    setEnhanceStates(prev => {
      const n = [...prev]
      n[i] = null
      return n
    })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setErr(null)
    const next = [...items]
    try {
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
        next.push({ url, is_cover: next.length === 0 })
      }
      await persist(next)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-caption text-subtle font-semibold">Photos · drag to reorder</span>
        {saving && (
          <span className="text-[10px] text-action flex items-center gap-1">
            <Loader2 size={10} className="animate-spin" /> saving
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it, i) => {
          const es = enhanceStates[i] ?? null
          const isEnhancing = es === 'loading'
          const hasEnhanced = es !== null && es !== 'loading'
          return (
            <div key={it.url + i} className="flex flex-col gap-1">
              <div
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(i)}
                className="relative group rounded-input overflow-hidden border border-divider aspect-[4/3] cursor-move bg-beige"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={`#${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCover(i)}
                  title={it.is_cover ? 'Cover image' : 'Mark as cover'}
                  className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-opacity ${
                    it.is_cover
                      ? 'bg-action text-white opacity-100'
                      : 'bg-white/85 text-navy opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {it.is_cover ? 'Cover' : 'Set cover'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 bg-navy/70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              {!hasEnhanced ? (
                <button
                  type="button"
                  onClick={() => enhanceImage(i)}
                  disabled={isEnhancing}
                  className="flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold bg-beige border border-divider text-subtle hover:text-action hover:border-action transition-colors disabled:opacity-50"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 size={9} className="animate-spin" /> Enhancing…
                    </>
                  ) : (
                    <>
                      <Wand2 size={9} /> Enhance
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="relative rounded overflow-hidden aspect-[4/3] border border-divider">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.url} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 text-center bg-navy/60 text-white text-[9px] py-0.5">
                        Before
                      </span>
                    </div>
                    <div className="relative rounded overflow-hidden aspect-[4/3] border border-action">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={es} alt="Enhanced" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 text-center bg-action/80 text-white text-[9px] py-0.5">
                        Enhanced
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => acceptEnhancement(i)}
                      className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold bg-action text-white hover:bg-action-hover transition-colors"
                    >
                      <Check size={9} /> Use enhanced
                    </button>
                    <button
                      type="button"
                      onClick={() => discardEnhancement(i)}
                      className="flex items-center justify-center px-1.5 py-1 rounded text-[10px] font-semibold bg-beige border border-divider text-subtle hover:text-danger transition-colors"
                    >
                      <X size={9} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <label
          className={`flex flex-col items-center justify-center rounded-input border-2 border-dashed aspect-[4/3] cursor-pointer transition-colors ${
            uploading
              ? 'border-action bg-action-light/20 opacity-60'
              : 'border-divider hover:border-action hover:bg-beige/30'
          }`}
        >
          {uploading ? (
            <Loader2 size={18} className="text-action animate-spin" strokeWidth={1.5} />
          ) : (
            <Upload size={18} className="text-subtle mb-1" strokeWidth={1.5} />
          )}
          <span className="text-caption text-subtle">{uploading ? 'Uploading…' : 'Add'}</span>
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
