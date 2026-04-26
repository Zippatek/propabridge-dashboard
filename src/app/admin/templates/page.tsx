'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import type { TemplateList, TemplateItem } from '@/lib/types'
import { adk } from '@/lib/client-api'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

export default function AdminTemplatesPage() {
  const [data, setData] = useState<TemplateList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string>('')
  const [editing, setEditing] = useState<TemplateItem | null>(null)
  const [creating, setCreating] = useState(false)

  const reload = async () => {
    setError(null)
    setData(null)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    try {
      const d = await adk.get<TemplateList>(`/templates?${params}`)
      setData(d)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category])

  const onDelete = async (name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return
    try {
      await adk.send(`/templates/${encodeURIComponent(name)}`, 'DELETE')
      reload()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-card border border-divider shadow-card p-5 flex flex-col sm:flex-row gap-4 items-end animate-fade-up">
        <div className="flex-1 w-full">
          <label className="block text-nav font-medium text-navy mb-2">Search</label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
              strokeWidth={1.8}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="welcome, viewing, payment…"
              className="w-full pl-9 pr-3 py-3 rounded-input border border-divider bg-white text-body text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-nav font-medium text-navy mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body text-navy focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
          >
            <option value="">All categories</option>
            {(data?.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-action hover:bg-action-hover text-white font-semibold px-5 py-3 rounded-button flex items-center gap-2 transition-all duration-150"
        >
          <Plus size={16} strokeWidth={2} />
          New template
        </button>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden animate-fade-up animate-fade-up-2">
        <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
          <h2 className="text-h4 text-navy">Registered Templates</h2>
          <span className="text-caption text-subtle">
            {data === null ? '—' : `${data.total} templates`}
          </span>
        </div>

        {data === null ? (
          <PageLoading />
        ) : data.items.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            No templates match the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Content SID</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {data.items.map((t) => (
                  <tr key={t.name} className="hover:bg-beige/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">{t.display_name}</p>
                      <p className="text-caption text-subtle font-mono">{t.name}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-caption text-subtle">{t.sid}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded text-caption font-semibold bg-beige text-subtle">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => setEditing(t)}
                          className="p-2 rounded-button text-subtle hover:text-action hover:bg-action-light transition-colors"
                          title="Edit SID"
                        >
                          <Pencil size={14} strokeWidth={1.8} />
                        </button>
                        <button
                          onClick={() => onDelete(t.name)}
                          className="p-2 rounded-button text-subtle hover:text-danger hover:bg-danger-light transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <EditModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
      {creating && (
        <CreateModal
          categories={data?.categories || []}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            reload()
          }}
        />
      )}
    </div>
  )
}

function EditModal({
  template,
  onClose,
  onSaved,
}: {
  template: TemplateItem
  onClose: () => void
  onSaved: () => void
}) {
  const [sid, setSid] = useState(template.sid)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await adk.send(`/templates/${encodeURIComponent(template.name)}`, 'PUT', { sid })
      onSaved()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Edit ${template.display_name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-nav font-medium text-navy mb-2">Content SID</label>
          <input
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body font-mono text-navy focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
            required
          />
        </div>
        {err && <p className="text-caption text-danger">{err}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-button border border-divider text-subtle hover:bg-beige font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-button bg-action hover:bg-action-hover text-white font-semibold disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CreateModal({
  onClose,
  onCreated,
}: {
  categories: string[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [sid, setSid] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await adk.send('/templates', 'POST', { name: name.trim(), sid: sid.trim() })
      onCreated()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Register a new template" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-nav font-medium text-navy mb-2">
            Template name (snake_case)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. weekend_open_house"
            className="w-full px-4 py-3 rounded-input border border-divider bg-white font-mono text-body text-navy focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-nav font-medium text-navy mb-2">Content SID</label>
          <input
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 rounded-input border border-divider bg-white font-mono text-body text-navy focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
            required
          />
        </div>
        {err && <p className="text-caption text-danger">{err}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-button border border-divider text-subtle hover:bg-beige font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-button bg-action hover:bg-action-hover text-white font-semibold disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-modal w-full max-w-md">
        <header className="flex items-center justify-between px-6 py-4 border-b border-divider">
          <h3 className="text-h4 text-navy">{title}</h3>
          <button onClick={onClose} className="text-subtle hover:text-navy">
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
