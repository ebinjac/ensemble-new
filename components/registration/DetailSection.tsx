// components/registration/DetailSection.tsx
import { ReactNode } from "react"

interface DetailSectionProps {
  title: string
  icon: ReactNode
  children: ReactNode
}

export function DetailSection({ title, icon, children }: DetailSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        {icon}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}
