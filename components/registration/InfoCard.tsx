// components/registration/InfoCard.tsx
import { ReactNode } from "react"

interface InfoCardProps {
  children: ReactNode
  className?: string
}

export function InfoCard({ children, className = "" }: InfoCardProps) {
  return (
    <div className={`bg-muted/30 rounded-lg p-6 border border-border ${className}`}>
      {children}
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
  isMono?: boolean
}

export function InfoRow({ label, value, isMono }: InfoRowProps) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-foreground">{label}</h4>
      <p className={`text-muted-foreground ${isMono ? 'font-mono text-sm' : ''}`}>
        {value}
      </p>
    </div>
  )
}
