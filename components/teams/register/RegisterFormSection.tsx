// components/teams/FormSection.tsx
import { ReactNode } from "react"

interface FormSectionProps {
  title: string
  icon: ReactNode
  children: ReactNode
  description?: string
}

export function FormSection({ title, icon, children, description }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        {icon}
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
