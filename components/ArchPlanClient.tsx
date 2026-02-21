'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import type { ArtifactFile } from '@/lib/aiAgent'
import {
  FiPlus,
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiFileText,
  FiDownload,
  FiEdit3,
  FiClock,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiGrid,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiLoader,
  FiTrash2,
} from 'react-icons/fi'

// ─── Constants ───────────────────────────────────────────────────────────────

const MANAGER_AGENT_ID = '69996390730bbd74d53e8b02'

const AGENTS = [
  { id: '69996390730bbd74d53e8b02', name: 'Documentation Orchestrator', role: 'Routes to sub-agents, aggregates output' },
  { id: '699963762361782dde9da362', name: 'Project Brief & Phase Plan Agent', role: 'Generates briefs and phase plans' },
  { id: '69996376730bbd74d53e8af1', name: 'Proposal & Contracts Agent', role: 'Generates proposals and fee schedules' },
  { id: '69996377730bbd74d53e8af3', name: 'Meeting & Reporting Agent', role: 'Generates meeting minutes and reports' },
]

const PROJECT_TYPES = ['Residential', 'Commercial', 'Institutional', 'Mixed-Use'] as const
const PLOT_UNITS = ['sqft', 'sqm', 'acres'] as const
const DOC_TYPES = ['Project Brief', 'Phase Plan', 'Proposal', 'Meeting Minutes', 'Progress Report'] as const
type DocType = (typeof DOC_TYPES)[number]
type ProjectType = (typeof PROJECT_TYPES)[number]

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  location: string
  plotSize: string
  plotUnit: string
  projectType: ProjectType
  budgetMin: string
  budgetMax: string
  startDate: string
  targetCompletion: string
  notes: string
  currentPhase: string
  createdAt: string
  lastActivity: string
  documentsGenerated: number
}

interface DocumentSection {
  heading: string
  content: string
  subsections: { subheading: string; details: string }[]
}

interface GeneratedDocument {
  id: string
  document_type: string
  title: string
  sections: DocumentSection[]
  milestones: { phase: string; milestone: string; duration: string; dependencies: string }[]
  fee_schedule: { phase: string; fee_percentage: string; fee_amount: string; payment_trigger: string }[]
  deliverables: { item: string; format: string; phase: string }[]
  action_items: { action: string; responsible: string; deadline: string; priority: string; status: string }[]
  risks: { risk: string; probability: string; impact: string; mitigation: string; owner: string }[]
  summary: string
  generatedAt: string
  projectId: string
}

interface Attendee {
  name: string
  role: string
}

interface PhaseStatus {
  name: string
  percentage: number
  status: string
  notes: string
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'sp1',
    name: 'Riverside Luxury Villas',
    location: 'Mumbai, Maharashtra',
    plotSize: '15000',
    plotUnit: 'sqft',
    projectType: 'Residential',
    budgetMin: '5000000',
    budgetMax: '8000000',
    startDate: '2025-03-01',
    targetCompletion: '2026-09-30',
    notes: 'Premium gated community with clubhouse and landscaping.',
    currentPhase: 'Design Development',
    createdAt: '2025-01-15T10:30:00Z',
    lastActivity: '2025-02-18T14:22:00Z',
    documentsGenerated: 4,
  },
  {
    id: 'sp2',
    name: 'TechPark Tower',
    location: 'Bangalore, Karnataka',
    plotSize: '45000',
    plotUnit: 'sqft',
    projectType: 'Commercial',
    budgetMin: '20000000',
    budgetMax: '35000000',
    startDate: '2025-06-01',
    targetCompletion: '2027-12-31',
    notes: 'Grade-A commercial office space with green certification.',
    currentPhase: 'Schematic Design',
    createdAt: '2025-02-01T09:00:00Z',
    lastActivity: '2025-02-20T11:45:00Z',
    documentsGenerated: 2,
  },
  {
    id: 'sp3',
    name: 'Heritage School Campus',
    location: 'Jaipur, Rajasthan',
    plotSize: '5',
    plotUnit: 'acres',
    projectType: 'Institutional',
    budgetMin: '12000000',
    budgetMax: '18000000',
    startDate: '2025-04-15',
    targetCompletion: '2027-06-30',
    notes: 'K-12 school campus with sports facilities and auditorium.',
    currentPhase: 'Pre-Design',
    createdAt: '2025-01-20T08:15:00Z',
    lastActivity: '2025-02-15T16:30:00Z',
    documentsGenerated: 1,
  },
]

const SAMPLE_DOCUMENT: GeneratedDocument = {
  id: 'sd1',
  document_type: 'Project Brief',
  title: 'Project Brief - Riverside Luxury Villas',
  sections: [
    {
      heading: 'Executive Summary',
      content: 'This project brief outlines the design and development of the Riverside Luxury Villas, a premium residential community located in Mumbai, Maharashtra. The project encompasses 15,000 sqft of development with an estimated budget range of $5M-$8M.',
      subsections: [
        { subheading: 'Project Vision', details: 'To create a world-class gated residential community that harmonizes modern luxury with natural riverfront landscapes, setting a new benchmark for premium living in Mumbai.' },
        { subheading: 'Key Objectives', details: 'Deliver 12 luxury villa units with premium amenities, achieve IGBC Gold certification, complete within 18-month timeline, and maintain budget within approved parameters.' },
      ],
    },
    {
      heading: 'Scope of Work',
      content: 'The architectural scope covers master planning, individual villa design, landscape architecture, clubhouse design, and infrastructure planning for the entire community.',
      subsections: [
        { subheading: 'Architectural Design', details: 'Full architectural design services from concept through construction documentation for all structures within the community.' },
        { subheading: 'Landscape Design', details: 'Comprehensive landscape architecture including hardscape, softscape, water features, and outdoor recreation areas.' },
      ],
    },
    {
      heading: 'Design Parameters',
      content: 'The design must comply with local building codes, environmental regulations, and the client\'s aesthetic preferences for contemporary tropical architecture.',
      subsections: [
        { subheading: 'Building Codes', details: 'Compliance with MCGM building regulations, Maharashtra Fire Safety Code, and National Building Code 2016.' },
        { subheading: 'Sustainability', details: 'Target IGBC Gold certification with provisions for rainwater harvesting, solar energy, and waste management systems.' },
      ],
    },
  ],
  milestones: [
    { phase: 'Pre-Design', milestone: 'Site analysis and feasibility study complete', duration: '4 weeks', dependencies: 'Client brief approval' },
    { phase: 'Schematic Design', milestone: 'Design concept presentation and approval', duration: '6 weeks', dependencies: 'Pre-design completion' },
    { phase: 'Design Development', milestone: 'Detailed design drawings finalized', duration: '8 weeks', dependencies: 'Schematic approval' },
    { phase: 'Construction Documents', milestone: 'Complete construction document set', duration: '10 weeks', dependencies: 'Design development approval' },
    { phase: 'Construction Administration', milestone: 'Project handover and completion', duration: '52 weeks', dependencies: 'Permit approvals' },
  ],
  fee_schedule: [],
  deliverables: [],
  action_items: [],
  risks: [],
  summary: 'The Riverside Luxury Villas project represents a significant opportunity to create a landmark residential development in Mumbai. With careful planning and execution, this project will deliver exceptional value to both the client and end-users.',
  generatedAt: '2025-02-18T14:22:00Z',
  projectId: 'sp1',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: string): string {
  const num = parseFloat(val)
  if (isNaN(num)) return val
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
  return `$${num}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatTimestamp(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function getProjectTypeBadgeColor(type: string): string {
  switch (type) {
    case 'Residential': return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40'
    case 'Commercial': return 'bg-blue-900/40 text-blue-300 border-blue-700/40'
    case 'Institutional': return 'bg-purple-900/40 text-purple-300 border-purple-700/40'
    case 'Mixed-Use': return 'bg-amber-900/40 text-amber-300 border-amber-700/40'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

function getPriorityColor(priority: string): string {
  const p = (priority || '').toLowerCase()
  if (p === 'high' || p === 'critical') return 'bg-red-900/40 text-red-300 border-red-700/40'
  if (p === 'medium') return 'bg-amber-900/40 text-amber-300 border-amber-700/40'
  return 'bg-green-900/40 text-green-300 border-green-700/40'
}

function getStatusColor(status: string): string {
  const s = (status || '').toLowerCase()
  if (s === 'completed' || s === 'done') return 'bg-green-900/40 text-green-300 border-green-700/40'
  if (s === 'in progress' || s === 'in-progress') return 'bg-blue-900/40 text-blue-300 border-blue-700/40'
  if (s === 'delayed' || s === 'at risk' || s === 'at-risk') return 'bg-red-900/40 text-red-300 border-red-700/40'
  return 'bg-muted text-muted-foreground border-border'
}

function getDocTypeIcon(docType: string): string {
  if (docType.includes('Brief')) return 'Brief'
  if (docType.includes('Phase')) return 'Phase'
  if (docType.includes('Proposal')) return 'Prop'
  if (docType.includes('Meeting')) return 'Mins'
  if (docType.includes('Progress') || docType.includes('Report')) return 'Rpt'
  return 'Doc'
}

// ─── ErrorBoundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
      <div className="h-4 bg-muted rounded w-4/5"></div>
      <div className="h-6 bg-muted rounded w-1/2 mt-6"></div>
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-6 bg-muted rounded w-2/5 mt-6"></div>
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
    </div>
  )
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground rounded-lg p-3 text-sm flex items-center gap-2">
      <FiAlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
      <span>{message}</span>
    </div>
  )
}

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <h3 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-3">Agent Status</h3>
      <div className="space-y-2">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
            <span className={`truncate ${activeAgentId === agent.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {agent.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DocumentViewer({ doc, fileOutputs, isEditing, onToggleEdit }: {
  doc: GeneratedDocument
  fileOutputs: ArtifactFile[]
  isEditing: boolean
  onToggleEdit: () => void
}) {
  const exportAsJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title || 'document'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsPdf = () => {
    if (Array.isArray(fileOutputs) && fileOutputs.length > 0) {
      const pdfFile = fileOutputs.find((f) => f?.format_type === 'pdf' || f?.name?.endsWith('.pdf'))
      if (pdfFile?.file_url) {
        window.open(pdfFile.file_url, '_blank')
        return
      }
      if (fileOutputs[0]?.file_url) {
        window.open(fileOutputs[0].file_url, '_blank')
        return
      }
    }
    window.print()
  }

  const sections = Array.isArray(doc?.sections) ? doc.sections : []
  const milestones = Array.isArray(doc?.milestones) ? doc.milestones : []
  const feeSchedule = Array.isArray(doc?.fee_schedule) ? doc.fee_schedule : []
  const deliverablesList = Array.isArray(doc?.deliverables) ? doc.deliverables : []
  const actionItems = Array.isArray(doc?.action_items) ? doc.action_items : []
  const risks = Array.isArray(doc?.risks) ? doc.risks : []
  const docType = doc?.document_type ?? ''

  return (
    <div className="h-full flex flex-col">
      {/* Document Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3 min-w-0">
          <FiFileText className="w-5 h-5 text-[hsl(36,60%,31%)] flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-semibold tracking-wide truncate">{doc?.title ?? 'Untitled Document'}</h2>
            <p className="text-xs text-muted-foreground">{formatTimestamp(doc?.generatedAt ?? '')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onToggleEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors">
            <FiEdit3 className="w-3.5 h-3.5" />
            {isEditing ? 'View' : 'Edit'}
          </button>
          <button onClick={exportAsJson} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors">
            <FiDownload className="w-3.5 h-3.5" />
            JSON
          </button>
          <button onClick={exportAsPdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[hsl(36,60%,31%)] hover:bg-[hsl(36,60%,36%)] text-[hsl(35,20%,95%)] transition-colors">
            <FiDownload className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Document Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Document Type Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-[hsl(36,60%,31%)]/20 text-[hsl(36,60%,50%)] border border-[hsl(36,60%,31%)]/30">
              {docType || 'Document'}
            </span>
          </div>

          {/* Summary */}
          {doc?.summary && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Summary</h3>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {renderMarkdown(doc.summary)}
              </div>
            </div>
          )}

          {/* Sections */}
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground border-b border-border pb-2">{section?.heading ?? ''}</h3>
              {section?.content && (
                <div className="text-sm text-foreground/80 leading-relaxed">
                  {renderMarkdown(section.content)}
                </div>
              )}
              {Array.isArray(section?.subsections) && section.subsections.length > 0 && (
                <div className="ml-4 space-y-3 border-l-2 border-[hsl(36,60%,31%)]/30 pl-4">
                  {section.subsections.map((sub, subIdx) => (
                    <div key={subIdx}>
                      <h4 className="font-sans text-sm font-medium text-foreground mb-1">{sub?.subheading ?? ''}</h4>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {renderMarkdown(sub?.details ?? '')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Milestones Table */}
          {milestones.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-3">Milestones</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Phase</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Milestone</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Duration</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Dependencies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((m, i) => (
                      <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="py-2.5 px-3 font-medium">{m?.phase ?? ''}</td>
                        <td className="py-2.5 px-3">{m?.milestone ?? ''}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{m?.duration ?? ''}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{m?.dependencies ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fee Schedule Table */}
          {feeSchedule.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-3">Fee Schedule</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Phase</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Fee %</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Payment Trigger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeSchedule.map((f, i) => (
                      <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="py-2.5 px-3 font-medium">{f?.phase ?? ''}</td>
                        <td className="py-2.5 px-3">{f?.fee_percentage ?? ''}</td>
                        <td className="py-2.5 px-3 text-[hsl(36,60%,50%)]">{f?.fee_amount ?? ''}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{f?.payment_trigger ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Deliverables Table */}
          {deliverablesList.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-3">Deliverables</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Item</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Format</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverablesList.map((d, i) => (
                      <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="py-2.5 px-3 font-medium">{d?.item ?? ''}</td>
                        <td className="py-2.5 px-3">{d?.format ?? ''}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{d?.phase ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Items Table */}
          {actionItems.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-3">Action Items</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Action</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Responsible</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Deadline</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Priority</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionItems.map((a, i) => (
                      <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="py-2.5 px-3 font-medium">{a?.action ?? ''}</td>
                        <td className="py-2.5 px-3">{a?.responsible ?? ''}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{a?.deadline ?? ''}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(a?.priority ?? '')}`}>
                            {a?.priority ?? ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(a?.status ?? '')}`}>
                            {a?.status ?? ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Risks Table */}
          {risks.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-3 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-amber-400" />
                Risk Assessment
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Risk</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Probability</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Impact</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Mitigation</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map((r, i) => (
                      <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="py-2.5 px-3 font-medium">{r?.risk ?? ''}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(r?.probability ?? '')}`}>
                            {r?.probability ?? ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(r?.impact ?? '')}`}>
                            {r?.impact ?? ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{r?.mitigation ?? ''}</td>
                        <td className="py-2.5 px-3">{r?.owner ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function ArchPlanClient() {
  // ── Navigation ──
  type Screen = 'dashboard' | 'workspace'
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  // ── Data ──
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [documentHistory, setDocumentHistory] = useState<GeneratedDocument[]>([])
  const [currentDocument, setCurrentDocument] = useState<GeneratedDocument | null>(null)
  const [fileOutputs, setFileOutputs] = useState<ArtifactFile[]>([])

  // ── UI State ──
  const [sampleDataOn, setSampleDataOn] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [activeDocType, setActiveDocType] = useState<DocType>('Project Brief')
  const [isEditing, setIsEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // ── New Project Form ──
  const emptyProject = {
    name: '',
    location: '',
    plotSize: '',
    plotUnit: 'sqft',
    projectType: 'Residential' as ProjectType,
    budgetMin: '',
    budgetMax: '',
    startDate: '',
    targetCompletion: '',
    notes: '',
  }
  const [newProject, setNewProject] = useState(emptyProject)

  // ── Contextual Inputs (Meeting Minutes) ──
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: '', role: '' }])
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingAgenda, setMeetingAgenda] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  // ── Contextual Inputs (Progress Report) ──
  const [phaseStatuses, setPhaseStatuses] = useState<PhaseStatus[]>([
    { name: 'Design Phase', percentage: 0, status: 'On Track', notes: '' },
    { name: 'Approval Phase', percentage: 0, status: 'On Track', notes: '' },
    { name: 'Construction Phase', percentage: 0, status: 'On Track', notes: '' },
    { name: 'Handover Phase', percentage: 0, status: 'On Track', notes: '' },
  ])
  const [budgetSpent, setBudgetSpent] = useState('')
  const [keyIssues, setKeyIssues] = useState('')

  // ── Contextual Inputs (Proposal) ──
  const [clientName, setClientName] = useState('')
  const [clientOrg, setClientOrg] = useState('')
  const [proposalValidUntil, setProposalValidUntil] = useState('')
  const [specialTerms, setSpecialTerms] = useState('')

  // ── localStorage Persistence ──
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const savedProjects = localStorage.getItem('archplan_projects')
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects))
      }
      const savedDocs = localStorage.getItem('archplan_documents')
      if (savedDocs) {
        setDocumentHistory(JSON.parse(savedDocs))
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    if (mounted && projects.length > 0) {
      try {
        localStorage.setItem('archplan_projects', JSON.stringify(projects))
      } catch {
        // ignore
      }
    }
  }, [projects, mounted])

  useEffect(() => {
    if (mounted && documentHistory.length > 0) {
      try {
        localStorage.setItem('archplan_documents', JSON.stringify(documentHistory))
      } catch {
        // ignore
      }
    }
  }, [documentHistory, mounted])

  // ── Sample Data Toggle ──
  useEffect(() => {
    if (sampleDataOn) {
      setProjects(SAMPLE_PROJECTS)
    } else {
      if (mounted) {
        try {
          const saved = localStorage.getItem('archplan_projects')
          setProjects(saved ? JSON.parse(saved) : [])
        } catch {
          setProjects([])
        }
      }
    }
  }, [sampleDataOn, mounted])

  // ── Derived Data ──
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'All' || p.projectType === filterType
    return matchesSearch && matchesType
  })

  const projectDocuments = documentHistory.filter((d) => d.projectId === selectedProject?.id)

  const totalActiveProjects = projects.length
  const totalDocuments = documentHistory.length
  const pendingApprovals = projects.filter((p) => (p.currentPhase || '').toLowerCase().includes('design') || (p.currentPhase || '').toLowerCase().includes('pre-design')).length

  // ── Save New Project ──
  const saveNewProject = () => {
    if (!newProject.name.trim()) return
    const project: Project = {
      id: Date.now().toString(),
      ...newProject,
      currentPhase: 'Pre-Design',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      documentsGenerated: 0,
    }
    setProjects((prev) => [project, ...prev])
    setNewProject(emptyProject)
    setShowNewProjectModal(false)
  }

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    setDocumentHistory((prev) => prev.filter((d) => d.projectId !== projectId))
    if (selectedProject?.id === projectId) {
      setSelectedProject(null)
      setCurrentDocument(null)
      setScreen('dashboard')
    }
  }

  const openProject = (project: Project) => {
    setSelectedProject(project)
    setCurrentDocument(null)
    setActiveDocType('Project Brief')
    setIsEditing(false)
    setShowHistory(false)
    setGenerationError(null)
    setFileOutputs([])
    setScreen('workspace')
  }

  // ── Generate Document ──
  const generateDocument = useCallback(async () => {
    if (!selectedProject) return
    setIsGenerating(true)
    setGenerationError(null)
    setActiveAgentId(MANAGER_AGENT_ID)

    let additionalContext: Record<string, unknown> = {}

    if (activeDocType === 'Meeting Minutes') {
      additionalContext = {
        attendees: attendees.filter((a) => a.name.trim()),
        meetingDate,
        agenda: meetingAgenda,
        discussionNotes: meetingNotes,
      }
    } else if (activeDocType === 'Progress Report') {
      additionalContext = {
        phaseStatuses,
        budgetSpent,
        keyIssues,
      }
    } else if (activeDocType === 'Proposal') {
      additionalContext = {
        clientName,
        clientOrganization: clientOrg,
        proposalValidUntil,
        specialTerms,
      }
    }

    const message = `Generate a ${activeDocType} for the following architectural project:

Project Name: ${selectedProject.name}
Location: ${selectedProject.location}
Plot Size: ${selectedProject.plotSize} ${selectedProject.plotUnit}
Project Type: ${selectedProject.projectType}
Budget Range: $${selectedProject.budgetMin} - $${selectedProject.budgetMax}
Timeline: ${selectedProject.startDate} to ${selectedProject.targetCompletion}
Additional Notes: ${selectedProject.notes}

Document Type: ${activeDocType}
${Object.keys(additionalContext).length > 0 ? `Additional Context: ${JSON.stringify(additionalContext)}` : ''}

Please generate a comprehensive, professional ${activeDocType} document.`

    try {
      const result = await callAIAgent(message, MANAGER_AGENT_ID)

      if (result.success && result?.response?.result) {
        const docData = result.response.result

        const parsedDoc: GeneratedDocument = {
          id: Date.now().toString(),
          document_type: docData?.document_type ?? activeDocType,
          title: docData?.title ?? `${activeDocType} - ${selectedProject.name}`,
          sections: Array.isArray(docData?.sections) ? docData.sections : [],
          milestones: Array.isArray(docData?.milestones) ? docData.milestones : [],
          fee_schedule: Array.isArray(docData?.fee_schedule) ? docData.fee_schedule : [],
          deliverables: Array.isArray(docData?.deliverables) ? docData.deliverables : [],
          action_items: Array.isArray(docData?.action_items) ? docData.action_items : [],
          risks: Array.isArray(docData?.risks) ? docData.risks : [],
          summary: docData?.summary ?? '',
          generatedAt: new Date().toISOString(),
          projectId: selectedProject.id,
        }

        setCurrentDocument(parsedDoc)
        setDocumentHistory((prev) => [parsedDoc, ...prev])

        // Update project stats
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProject.id
              ? { ...p, documentsGenerated: p.documentsGenerated + 1, lastActivity: new Date().toISOString() }
              : p
          )
        )

        // Check for file outputs
        if (Array.isArray(result?.module_outputs?.artifact_files)) {
          setFileOutputs(result.module_outputs.artifact_files)
        }
      } else {
        setGenerationError(result?.error ?? 'Failed to generate document. Please try again.')
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
      setActiveAgentId(null)
    }
  }, [selectedProject, activeDocType, attendees, meetingDate, meetingAgenda, meetingNotes, phaseStatuses, budgetSpent, keyIssues, clientName, clientOrg, proposalValidUntil, specialTerms])

  const loadHistoricDocument = (doc: GeneratedDocument) => {
    setCurrentDocument(doc)
    setShowHistory(false)
    setFileOutputs([])
  }

  // ── Render ──
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <FiLoader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* ─── SIDEBAR ─── */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[hsl(20,28%,6%)] border-r border-border flex flex-col flex-shrink-0 transition-all duration-300`}>
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(36,60%,31%)] flex items-center justify-center flex-shrink-0">
                <FiGrid className="w-4 h-4 text-[hsl(35,20%,95%)]" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-serif text-lg font-semibold tracking-wide text-foreground">ArchPlan AI</h1>
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Architecture Docs</p>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          {!sidebarCollapsed && (
            <div className="p-3 space-y-1">
              <button
                onClick={() => { setScreen('dashboard'); setSelectedProject(null); setCurrentDocument(null) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${screen === 'dashboard' ? 'bg-[hsl(36,60%,31%)]/20 text-[hsl(36,60%,50%)]' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
              >
                <FiGrid className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          )}

          {/* Project List */}
          {!sidebarCollapsed && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                <div className="space-y-0.5 pb-4">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => openProject(project)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${selectedProject?.id === project.id && screen === 'workspace' ? 'bg-[hsl(36,60%,31%)]/20 text-[hsl(36,60%,50%)]' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                    >
                      <FiFolder className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 py-4 text-center">No projects yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Toggle sidebar */}
          <div className="p-3 border-t border-border">
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              {sidebarCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 border-b border-border bg-card/30 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              {screen === 'workspace' && (
                <button
                  onClick={() => { setScreen('dashboard'); setSelectedProject(null); setCurrentDocument(null) }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Dashboard
                </button>
              )}
              {screen === 'workspace' && selectedProject && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <span className="font-serif text-sm font-medium tracking-wide">{selectedProject.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getProjectTypeBadgeColor(selectedProject.projectType)}`}>
                    {selectedProject.projectType}
                  </span>
                </>
              )}
              {screen === 'dashboard' && (
                <span className="font-serif text-sm font-medium tracking-wide">Project Dashboard</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</label>
              <button
                id="sample-toggle"
                role="switch"
                aria-checked={sampleDataOn}
                onClick={() => setSampleDataOn(!sampleDataOn)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${sampleDataOn ? 'bg-[hsl(36,60%,31%)]' : 'bg-input'}`}
              >
                <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${sampleDataOn ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </header>

          {/* Content Area */}
          {screen === 'dashboard' && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(36,60%,31%)]/20 flex items-center justify-center">
                        <FiFolder className="w-5 h-5 text-[hsl(36,60%,50%)]" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold font-mono">{totalActiveProjects}</p>
                        <p className="text-xs text-muted-foreground">Active Projects</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                        <FiClock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold font-mono">{pendingApprovals}</p>
                        <p className="text-xs text-muted-foreground">Pending Approvals</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                        <FiFileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold font-mono">{totalDocuments}</p>
                        <p className="text-xs text-muted-foreground">Documents Generated</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search projects by name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="relative">
                    <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-input border border-border rounded-lg pl-10 pr-8 py-2 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      <option value="All">All Types</option>
                      {PROJECT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(36,60%,31%)] hover:bg-[hsl(36,60%,36%)] text-[hsl(35,20%,95%)] font-medium text-sm transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    New Project
                  </button>
                </div>

                {/* Project Cards Grid */}
                {filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => openProject(project)}
                        className="rounded-lg border border-border bg-card p-5 cursor-pointer hover:border-[hsl(36,60%,31%)]/50 hover:shadow-lg hover:shadow-[hsl(36,60%,31%)]/5 transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0">
                            <h3 className="font-serif text-base font-semibold tracking-wide truncate group-hover:text-[hsl(36,60%,50%)] transition-colors">{project.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <FiMapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{project.location}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteProject(project.id) }}
                            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getProjectTypeBadgeColor(project.projectType)}`}>
                            {project.projectType}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(project.currentPhase)}`}>
                            {project.currentPhase}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FiDollarSign className="w-3 h-3" />
                            <span>{formatCurrency(project.budgetMin)} - {formatCurrency(project.budgetMax)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FiCalendar className="w-3 h-3" />
                            <span>{formatDate(project.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FiFileText className="w-3 h-3" />
                            <span>{project.documentsGenerated} docs</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FiClock className="w-3 h-3" />
                            <span>{formatDate(project.lastActivity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <FiFolder className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold tracking-wide mb-2">
                      {searchTerm || filterType !== 'All' ? 'No matching projects' : 'Create your first project'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm || filterType !== 'All'
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Start by creating a new architecture project. You can then generate professional documents using AI.'}
                    </p>
                    {!searchTerm && filterType === 'All' && (
                      <button
                        onClick={() => setShowNewProjectModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(36,60%,31%)] hover:bg-[hsl(36,60%,36%)] text-[hsl(35,20%,95%)] font-medium text-sm transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                        New Project
                      </button>
                    )}
                  </div>
                )}

                {/* Agent Status */}
                <AgentStatusPanel activeAgentId={activeAgentId} />
              </div>
            </div>
          )}

          {/* ─── WORKSPACE SCREEN ─── */}
          {screen === 'workspace' && selectedProject && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel (40%) */}
              <div className="w-[40%] border-r border-border flex flex-col min-h-0 flex-shrink-0">
                {/* Doc Type Tabs */}
                <div className="border-b border-border flex-shrink-0">
                  <div className="w-full overflow-x-auto">
                    <div className="flex gap-0 px-2 pt-2">
                      {DOC_TYPES.map((dt) => (
                        <button
                          key={dt}
                          onClick={() => setActiveDocType(dt)}
                          className={`px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t-lg transition-colors ${activeDocType === dt ? 'bg-card border border-b-0 border-border text-[hsl(36,60%,50%)]' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {dt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contextual Form */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {/* Project Summary (always shown) */}
                    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                      <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground">Project Summary</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{selectedProject.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium">{selectedProject.projectType}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-medium">{selectedProject.location}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Plot:</span>
                          <p className="font-medium">{selectedProject.plotSize} {selectedProject.plotUnit}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <p className="font-medium">{formatCurrency(selectedProject.budgetMin)} - {formatCurrency(selectedProject.budgetMax)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeline:</span>
                          <p className="font-medium">{formatDate(selectedProject.startDate)} - {formatDate(selectedProject.targetCompletion)}</p>
                        </div>
                      </div>
                      {selectedProject.notes && (
                        <div className="text-xs mt-2">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="text-foreground/80 mt-0.5">{selectedProject.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Meeting Minutes Additional Fields */}
                    {activeDocType === 'Meeting Minutes' && (
                      <div className="space-y-3">
                        <h4 className="font-serif text-sm font-semibold tracking-wide">Meeting Details</h4>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Meeting Date & Time</label>
                          <input
                            type="datetime-local"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Attendees</label>
                          {attendees.map((att, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                placeholder="Name"
                                value={att.name}
                                onChange={(e) => {
                                  setAttendees((prev) => prev.map((a, i) => i === idx ? { ...a, name: e.target.value } : a))
                                }}
                                className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              <input
                                type="text"
                                placeholder="Role"
                                value={att.role}
                                onChange={(e) => {
                                  setAttendees((prev) => prev.map((a, i) => i === idx ? { ...a, role: e.target.value } : a))
                                }}
                                className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              {attendees.length > 1 && (
                                <button
                                  onClick={() => setAttendees((prev) => prev.filter((_, i) => i !== idx))}
                                  className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
                                >
                                  <FiX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => setAttendees((prev) => [...prev, { name: '', role: '' }])}
                            className="flex items-center gap-1.5 text-xs text-[hsl(36,60%,50%)] hover:text-[hsl(36,60%,60%)] transition-colors"
                          >
                            <FiPlus className="w-3 h-3" />
                            Add Attendee
                          </button>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Agenda</label>
                          <textarea
                            value={meetingAgenda}
                            onChange={(e) => setMeetingAgenda(e.target.value)}
                            placeholder="Enter agenda items..."
                            rows={3}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Discussion Notes</label>
                          <textarea
                            value={meetingNotes}
                            onChange={(e) => setMeetingNotes(e.target.value)}
                            placeholder="Enter discussion notes..."
                            rows={4}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Progress Report Additional Fields */}
                    {activeDocType === 'Progress Report' && (
                      <div className="space-y-3">
                        <h4 className="font-serif text-sm font-semibold tracking-wide">Phase Status Updates</h4>
                        {phaseStatuses.map((ps, idx) => (
                          <div key={idx} className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{ps.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{ps.percentage}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={ps.percentage}
                              onChange={(e) => {
                                setPhaseStatuses((prev) =>
                                  prev.map((p, i) => i === idx ? { ...p, percentage: parseInt(e.target.value) } : p)
                                )
                              }}
                              className="w-full accent-[hsl(36,60%,31%)]"
                            />
                            <div className="flex gap-2">
                              <select
                                value={ps.status}
                                onChange={(e) => {
                                  setPhaseStatuses((prev) =>
                                    prev.map((p, i) => i === idx ? { ...p, status: e.target.value } : p)
                                  )
                                }}
                                className="flex-1 bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="On Track">On Track</option>
                                <option value="Delayed">Delayed</option>
                                <option value="At Risk">At Risk</option>
                                <option value="Completed">Completed</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Notes..."
                                value={ps.notes}
                                onChange={(e) => {
                                  setPhaseStatuses((prev) =>
                                    prev.map((p, i) => i === idx ? { ...p, notes: e.target.value } : p)
                                  )
                                }}
                                className="flex-1 bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </div>
                          </div>
                        ))}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Budget Spent ($)</label>
                          <input
                            type="number"
                            value={budgetSpent}
                            onChange={(e) => setBudgetSpent(e.target.value)}
                            placeholder="e.g. 2500000"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Key Issues</label>
                          <textarea
                            value={keyIssues}
                            onChange={(e) => setKeyIssues(e.target.value)}
                            placeholder="Describe any key issues..."
                            rows={3}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Proposal Additional Fields */}
                    {activeDocType === 'Proposal' && (
                      <div className="space-y-3">
                        <h4 className="font-serif text-sm font-semibold tracking-wide">Proposal Details</h4>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Client Name *</label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="e.g. Mr. Raj Mehta"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Client Organization</label>
                          <input
                            type="text"
                            value={clientOrg}
                            onChange={(e) => setClientOrg(e.target.value)}
                            placeholder="e.g. Mehta Constructions Pvt Ltd"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Proposal Valid Until</label>
                          <input
                            type="date"
                            value={proposalValidUntil}
                            onChange={(e) => setProposalValidUntil(e.target.value)}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Special Terms & Conditions</label>
                          <textarea
                            value={specialTerms}
                            onChange={(e) => setSpecialTerms(e.target.value)}
                            placeholder="Any special terms or conditions..."
                            rows={3}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Project Brief / Phase Plan - read only summary is enough */}
                    {(activeDocType === 'Project Brief' || activeDocType === 'Phase Plan') && (
                      <div className="rounded-lg border border-border bg-muted/10 p-4">
                        <p className="text-xs text-muted-foreground">
                          The {activeDocType} will be generated using the project details above. All relevant project information will be included in the document automatically.
                        </p>
                      </div>
                    )}

                    {/* Error Display */}
                    {generationError && <InlineError message={generationError} />}

                    {/* Generate Button */}
                    <button
                      onClick={generateDocument}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[hsl(36,60%,31%)] hover:bg-[hsl(36,60%,36%)] disabled:opacity-50 disabled:cursor-not-allowed text-[hsl(35,20%,95%)] font-medium text-sm transition-colors"
                    >
                      {isGenerating ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Generating {activeDocType}...
                        </>
                      ) : (
                        <>
                          <FiFileText className="w-4 h-4" />
                          Generate {activeDocType}
                        </>
                      )}
                    </button>

                    {/* Document History Toggle */}
                    <div className="border-t border-border pt-4">
                      <button
                        onClick={() => setShowHistory((prev) => !prev)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FiClock className="w-4 h-4" />
                          Document History ({projectDocuments.length})
                        </span>
                        {showHistory ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                      </button>
                      {showHistory && (
                        <div className="mt-2 space-y-1.5">
                          {projectDocuments.length > 0 ? (
                            projectDocuments.map((doc) => (
                              <button
                                key={doc.id}
                                onClick={() => loadHistoricDocument(doc)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${currentDocument?.id === doc.id ? 'bg-[hsl(36,60%,31%)]/15 border border-[hsl(36,60%,31%)]/30' : 'hover:bg-muted/30'}`}
                              >
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border flex-shrink-0">
                                  {getDocTypeIcon(doc?.document_type ?? '')}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">{doc?.title ?? 'Untitled'}</p>
                                  <p className="text-[10px] text-muted-foreground">{formatTimestamp(doc?.generatedAt ?? '')}</p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No documents generated yet for this project.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Agent Status */}
                    <AgentStatusPanel activeAgentId={activeAgentId} />
                  </div>
                </div>
              </div>

              {/* Right Panel (60%) - Document Viewer */}
              <div className="flex-1 flex flex-col min-h-0">
                {isGenerating ? (
                  <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-border bg-card/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FiLoader className="w-4 h-4 animate-spin text-[hsl(36,60%,50%)]" />
                        Generating {activeDocType}...
                      </div>
                    </div>
                    <SkeletonLoader />
                  </div>
                ) : currentDocument ? (
                  <DocumentViewer
                    doc={currentDocument}
                    fileOutputs={fileOutputs}
                    isEditing={isEditing}
                    onToggleEdit={() => setIsEditing((prev) => !prev)}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8 max-w-sm">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <FiFileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-serif text-lg font-semibold tracking-wide mb-2">No Document Selected</h3>
                      <p className="text-sm text-muted-foreground">
                        Select a document type from the left panel and click &quot;Generate&quot; to create a professional architectural document, or choose from your document history.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ─── NEW PROJECT MODAL ─── */}
        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-end">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNewProjectModal(false)}
            />
            {/* Slide-over Panel */}
            <div className="relative w-full max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-serif text-lg font-semibold tracking-wide">New Project</h2>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-4">
                  {/* Project Name */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project Name *</label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Riverside Luxury Villas"
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location *</label>
                    <input
                      type="text"
                      value={newProject.location}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Plot Size + Unit */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plot Size</label>
                      <input
                        type="number"
                        value={newProject.plotSize}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, plotSize: e.target.value }))}
                        placeholder="e.g. 15000"
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Unit</label>
                      <div className="relative">
                        <select
                          value={newProject.plotUnit}
                          onChange={(e) => setNewProject((prev) => ({ ...prev, plotUnit: e.target.value }))}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                        >
                          {PLOT_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project Type</label>
                    <div className="relative">
                      <select
                        value={newProject.projectType}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, projectType: e.target.value as ProjectType }))}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        {PROJECT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget Min ($)</label>
                      <input
                        type="number"
                        value={newProject.budgetMin}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, budgetMin: e.target.value }))}
                        placeholder="e.g. 5000000"
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget Max ($)</label>
                      <input
                        type="number"
                        value={newProject.budgetMax}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, budgetMax: e.target.value }))}
                        placeholder="e.g. 8000000"
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Date</label>
                      <input
                        type="date"
                        value={newProject.startDate}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Completion</label>
                      <input
                        type="date"
                        value={newProject.targetCompletion}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, targetCompletion: e.target.value }))}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Additional Notes</label>
                    <textarea
                      value={newProject.notes}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional project details, requirements, or preferences..."
                      rows={4}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <button
                  onClick={() => { setShowNewProjectModal(false); setNewProject(emptyProject) }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNewProject}
                  disabled={!newProject.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[hsl(36,60%,31%)] hover:bg-[hsl(36,60%,36%)] disabled:opacity-50 disabled:cursor-not-allowed text-[hsl(35,20%,95%)] font-medium text-sm transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                  Save Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
