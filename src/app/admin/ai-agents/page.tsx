'use client'

import { useEffect, useState } from 'react'
import {
  MessageCircle,
  ClipboardCheck,
  Send,
  CalendarClock,
  RefreshCw,
  Bot,
  Zap,
  PlayCircle,
  UserRoundCog,
} from 'lucide-react'
import { adk } from '@/lib/client-api'
import { formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Agent {
  id: string
  name: string
  description: string
  category: string
  status: 'active' | 'running' | 'paused' | 'error'
  schedule?: string | null
  last_run?: string | null
  last_result?: string | null
  tools_used?: string[]
  icon?: string
}

const ICON_MAP: Record<string, typeof Bot> = {
  'message-circle': MessageCircle,
  'clipboard-check': ClipboardCheck,
  'send': Send,
  'calendar-clock': CalendarClock,
  'zap': Zap,
  'user-round-cog': UserRoundCog,
}

function AgentIcon({ name }: { name?: string }) {
  const Icon = (name && ICON_MAP[name]) || Bot
  return <Icon size={24} strokeWidth={1.5} />
}

const categoryColor: Record<string, string> = {
  conversational: 'bg-action-light text-action',
  analytics: 'bg-gold/10 text-gold',
  automation: 'bg-verified/10 text-verified',
  cron: 'bg-beige text-subtle',
}

export default function AdminAiAgentsPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)
  const [triggerResults, setTriggerResults] = useState<Record<string, string>>({})

  useEffect(() => {
    adk
      .get<{ agents: Agent[] }>('/agents')
      .then((d) => setAgents(d.agents || []))
      .catch((e) => setError((e as Error).message))
  }, [])

  const trigger = async (agentId: string) => {
    setTriggeringId(agentId)
    setTriggerResults((prev) => ({ ...prev, [agentId]: '' }))
    try {
      const res = await adk.send<{ message?: string; result?: string }>(
        `/agents/${agentId}/trigger`,
        'POST',
      )
      setTriggerResults((prev) => ({
        ...prev,
        [agentId]: res.message || res.result || 'Triggered successfully.',
      }))
    } catch (e) {
      setTriggerResults((prev) => ({
        ...prev,
        [agentId]: (e as Error).message,
      }))
    } finally {
      setTriggeringId(null)
    }
  }

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h3 text-navy flex items-center gap-2">
          <Bot size={22} strokeWidth={1.8} className="text-action" />
          AI Agents
        </h1>
        <p className="text-body-sm text-subtle mt-1">
          All autonomous agents running on the Propabridge ADK.
        </p>
      </div>

      {agents === null ? (
        <PageLoading />
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-card border border-divider shadow-card p-16 text-center text-subtle text-body-sm">
          No agents registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
          {agents.map((agent) => {
            const cat = agent.category?.toLowerCase() || 'cron'
            const catClass = categoryColor[cat] || 'bg-beige text-subtle'
            const result = triggerResults[agent.id]

            return (
              <div
                key={agent.id}
                className="bg-white rounded-card border border-divider shadow-card p-5 flex flex-col gap-4"
              >
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-action-light text-action flex items-center justify-center flex-shrink-0">
                    <AgentIcon name={agent.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-navy">{agent.name}</h2>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-badge uppercase ${catClass}`}
                      >
                        {agent.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-badge ${
                          agent.status === 'active'
                            ? 'bg-verified/10 text-verified'
                            : agent.status === 'running'
                            ? 'bg-gold/10 text-gold'
                            : agent.status === 'paused'
                            ? 'bg-beige text-subtle'
                            : 'bg-danger/10 text-danger'
                        }`}
                      >
                        {agent.status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-body-sm text-subtle mt-1 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 text-caption bg-beige rounded-lg p-3">
                  <div>
                    <p className="text-placeholder uppercase tracking-wider font-semibold mb-0.5">
                      Schedule
                    </p>
                    <p className="text-navy">{agent.schedule || 'Manual'}</p>
                  </div>
                  <div>
                    <p className="text-placeholder uppercase tracking-wider font-semibold mb-0.5">
                      Last run
                    </p>
                    <p className="text-navy">
                      {agent.last_run ? formatDateTime(agent.last_run) : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Tools */}
                {agent.tools_used && agent.tools_used.length > 0 && (
                  <div>
                    <p className="text-caption text-placeholder uppercase tracking-wider font-semibold mb-2">
                      Tools
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tools_used.map((t) => (
                        <span
                          key={t}
                          className="bg-beige border border-divider text-subtle text-[10px] font-medium px-2 py-0.5 rounded-badge"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last result */}
                {(result || agent.last_result) && (
                  <div className="bg-beige/60 border border-divider rounded-lg p-3">
                    <p className="text-caption text-placeholder uppercase tracking-wider font-semibold mb-1">
                      {result ? 'Trigger result' : 'Last result'}
                    </p>
                    <p className="text-body-sm text-navy leading-relaxed line-clamp-3">
                      {result || agent.last_result}
                    </p>
                  </div>
                )}

                {/* Trigger */}
                {agent.id === 'relationship_manager' || agent.category === 'conversational' ? (
                  <p className="text-caption text-subtle italic">
                    {agent.id === 'relationship_manager'
                      ? 'Always-on: updates automatically on every user turn.'
                      : 'Conversational agent — always on.'}
                  </p>
                ) : (
                  <button
                    onClick={() => trigger(agent.id)}
                    disabled={triggeringId === agent.id}
                    className="flex items-center gap-2 text-body-sm font-semibold text-action bg-action-light hover:bg-action hover:text-white border border-action/20 px-4 py-2.5 rounded-button transition-all duration-150 disabled:opacity-50 w-fit"
                  >
                    {triggeringId === agent.id ? (
                      <RefreshCw size={14} strokeWidth={2} className="animate-spin" />
                    ) : (
                      <PlayCircle size={14} strokeWidth={2} />
                    )}
                    {triggeringId === agent.id ? 'Running…' : 'Trigger now'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
