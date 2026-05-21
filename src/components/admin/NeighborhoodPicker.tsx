'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import { be } from '@/lib/client-api'

export type NeighborhoodOption = {
  id: string
  slug?: string
  name: string
  city: string
}

type Props = {
  value: string
  onChange: (name: string, option?: NeighborhoodOption) => void
  /** When user picks a catalog row, suggest city if the listing city field is empty. */
  onCitySuggestion?: (city: string) => void
  cityHint?: string
  inputCls: string
  label?: string
  placeholder?: string
}

function slugify(name: string, city: string) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function NeighborhoodPicker({
  value,
  onChange,
  onCitySuggestion,
  cityHint,
  inputCls,
  label = 'Neighborhood',
  placeholder = 'Search or select…',
}: Props) {
  const [options, setOptions] = useState<NeighborhoodOption[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState(cityHint || 'Abuja')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const json = await be.get<{ neighborhoods: NeighborhoodOption[] }>('/neighborhoods?limit=200')
      setOptions(json.neighborhoods || [])
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return options.slice(0, 12)
    return options
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q) ||
          (o.slug || '').toLowerCase().includes(q),
      )
      .slice(0, 12)
  }, [options, value])

  const pick = (o: NeighborhoodOption) => {
    onChange(o.name, o)
    onCitySuggestion?.(o.city)
    setOpen(false)
    setShowCreate(false)
  }

  const onCreate = async () => {
    const name = newName.trim()
    const city = newCity.trim()
    if (!name || !city) {
      setCreateError('Name and city are required')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const slug = slugify(name, city)
      await be.send('/neighborhoods', 'POST', {
        slug,
        name,
        city,
      })
      const created: NeighborhoodOption = { id: slug, slug, name, city }
      setOptions((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(name, created)
      onCitySuggestion?.(city)
      setShowCreate(false)
      setNewName('')
      setOpen(false)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Could not create neighborhood')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative block">
      <span className="text-caption text-subtle font-semibold mb-1.5 block">{label}</span>
      <div className="relative">
        <input
          className={`${inputCls} pr-9`}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
          aria-hidden
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-divider rounded-card shadow-modal max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-body-sm text-subtle">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : (
            <>
              {filtered.length > 0 ? (
                <ul className="py-1">
                  {filtered.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-body-sm hover:bg-beige text-navy"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pick(o)}
                      >
                        <span className="font-medium">{o.name}</span>
                        <span className="text-subtle"> — {o.city}</span>
                        {o.slug ? (
                          <span className="block text-caption text-subtle">{o.slug}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-2 text-body-sm text-subtle">No match in catalog.</p>
              )}
              <div className="border-t border-divider p-2 space-y-2">
                {!showCreate ? (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2 py-2 text-body-sm text-action font-semibold hover:bg-beige rounded"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setShowCreate(true)
                      setNewName(value.trim())
                      setNewCity(cityHint || 'Abuja')
                    }}
                  >
                    <Plus size={14} /> Create new neighborhood
                  </button>
                ) : (
                  <div className="space-y-2 px-1">
                    <input
                      className={inputCls}
                      placeholder="Neighborhood name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <input
                      className={inputCls}
                      placeholder="City"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                    />
                    {createError ? (
                      <p className="text-caption text-red-600">{createError}</p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={creating}
                        className="flex-1 px-3 py-2 rounded-button bg-action text-white text-body-sm font-semibold disabled:opacity-60"
                        onClick={onCreate}
                      >
                        {creating ? 'Saving…' : 'Save to catalog'}
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 text-body-sm text-subtle"
                        onClick={() => setShowCreate(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <Link
                  href="/admin/neighborhoods"
                  className="block text-center text-caption text-subtle hover:text-action py-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage all neighborhoods →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
