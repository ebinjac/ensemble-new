
// components/ui/FormSection.tsx
import { ReactNode } from "react"
import { Separator } from "@/components/ui/separator"

interface FormSectionProps {
  title: string
  icon: ReactNode
  children: ReactNode
  showSeparator?: boolean
}

export function FormSection({ title, icon, children, showSeparator = true }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </div>
      {children}
      {showSeparator && <Separator />}
    </div>
  )
}
