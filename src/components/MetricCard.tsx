import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  hint?: string
  icon: ReactNode
}

export function MetricCard({ label, value, hint, icon }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        {hint ? <div className="metric-hint">{hint}</div> : null}
      </div>
      <div className="metric-icon">{icon}</div>
    </div>
  )
}
