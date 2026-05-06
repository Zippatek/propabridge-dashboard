'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X, Check } from 'lucide-react'
import { be } from '@/lib/client-api'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Blog {
  id: string
  slug: string
  title: string
  category: string
  excerpt?: string
  content_html?: string
  cover_image?: string
  author_name?: string
  author_image?: string
  published?: boolean
  published_at?: string
  created_at?: string
  updated_at?: string
}

const EMPTY: Partial<Blog> = {
  slug: '',
  title: '',
  category: 'GUIDE',
  excerpt: '',
  content_html: '',
  cover_image: '',
  author_name: 'PROPABRIDGE TEAM',
  published: true,
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Partial<Blog> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const json = await be.get<{ data: Blog[] }>('/blogs?limit=200')
      setBlogs(json.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load blogs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onSave = async () => {
    if (!editing?.slug || !editing?.title) {
      alert('Slug and title are required')
      return
    }
    setSaving(true)
    try {
      const isEdit = blogs.some((b) => b.slug === editing.slug || b.id === editing.id)
      if (isEdit && editing.id) {
        await be.send(`/blogs/${editing.slug || editing.id}`, 'PATCH', editing)
      } else {
        await be.send('/blogs', 'POST', editing)
      }
      setEditing(null)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (b: Blog) => {
    if (!confirm(`Delete "${b.title}"?`)) return
    try {
      await be.send(`/blogs/${b.slug || b.id}`, 'DELETE')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <PageLoading label="Loading blogs..." />
  if (error) return <PageError message={error} onRetry={load} />

  const filtered = blogs.filter((b) =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.slug?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-dashboard mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 text-navy">Blogs</h1>
          <p className="text-body-sm text-subtle mt-1">{blogs.length} total · manage consumer site blog content</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-action text-white text-body-sm font-semibold hover:bg-action-hover transition-colors duration-200"
        >
          <Plus size={16} /> New Blog
        </button>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or slug..."
          className="w-full pl-10 pr-3 py-2 rounded-input border border-divider text-body-sm focus:outline-none focus:border-action"
        />
      </div>

      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-beige border-b border-divider">
            <tr className="text-left text-caption text-subtle uppercase tracking-wide">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-divider/50 hover:bg-beige/30">
                <td className="px-4 py-3 text-body-sm font-medium text-navy">{b.title}</td>
                <td className="px-4 py-3 text-body-sm text-subtle font-mono">{b.slug}</td>
                <td className="px-4 py-3 text-body-sm">{b.category}</td>
                <td className="px-4 py-3 text-body-sm">
                  {b.published ? (
                    <span className="inline-block px-2 py-0.5 rounded-badge text-[10px] font-bold bg-verified-light text-verified">PUBLISHED</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-badge text-[10px] font-bold bg-beige text-subtle">DRAFT</span>
                  )}
                </td>
                <td className="px-4 py-3 text-body-sm text-subtle">
                  {b.published_at ? new Date(b.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => setEditing(b)} className="text-subtle hover:text-action" aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => onDelete(b)} className="text-subtle hover:text-danger" aria-label="Delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-subtle">No blogs found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-navy/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-card shadow-modal w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-divider">
              <h2 className="text-h3 text-navy">{editing.id ? 'Edit Blog' : 'New Blog'}</h2>
              <button onClick={() => setEditing(null)} className="text-subtle hover:text-navy"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Slug *">
                <input
                  value={editing.slug || ''}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="renting-abuja-guide"
                  className="w-full px-3 py-2 rounded-input border border-divider text-body-sm focus:outline-none focus:border-action font-mono"
                />
              </Field>
              <Field label="Title *">
                <input
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-input border border-divider text-body-sm focus:outline-none focus:border-action"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select
                    value={editing.category || 'GUIDE'}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-input border border-divider text-body-sm"
                  >
                    <option>GUIDE</option>
                    <option>NEWS</option>
                    <option>MARKET</option>
                    <option>STORY</option>
                  </select>
                </Field>
                <Field label="Author Name">
                  <input
                    value={editing.author_name || ''}
                    onChange={(e) => setEditing({ ...editing, author_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-input border border-divider text-body-sm"
                  />
                </Field>
              </div>
              <Field label="Cover Image URL">
                <input
                  value={editing.cover_image || ''}
                  onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })}
                  placeholder="https://storage.googleapis.com/propabridge-listings-us/blogs/..."
                  className="w-full px-3 py-2 rounded-input border border-divider text-body-sm font-mono"
                />
              </Field>
              <Field label="Excerpt">
                <textarea
                  value={editing.excerpt || ''}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-input border border-divider text-body-sm"
                />
              </Field>
              <Field label="Content (HTML)">
                <textarea
                  value={editing.content_html || ''}
                  onChange={(e) => setEditing({ ...editing, content_html: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 rounded-input border border-divider text-body-sm font-mono"
                />
              </Field>
              <label className="flex items-center gap-2 text-body-sm">
                <input
                  type="checkbox"
                  checked={!!editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                />
                Published
              </label>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-divider">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-button border border-divider text-body-sm">Cancel</button>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-action text-white text-body-sm font-semibold hover:bg-action-hover disabled:opacity-50"
              >
                <Check size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-caption font-semibold text-subtle uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}
