// components/teams/ContactSection.tsx (Alternative version)
import { User, Mail } from "lucide-react"
import { Control } from "react-hook-form"
import { FormInput } from "@/components/ui/form-input"
import type { TeamFormValues } from "@/lib/teamFormSchema"

interface ContactSectionProps {
  control: Control<TeamFormValues>
  disabled?: boolean
}

export function ContactSection({ control, disabled }: ContactSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormInput
        control={control}
        name="contactName"
        label="Contact Name *"
        placeholder="Enter contact name"
        description="Primary contact person for this team."
        icon={<User className="h-4 w-4 text-muted-foreground" />}
        disabled={disabled}
      />

      <FormInput
        control={control}
        name="contactEmail"
        label="Contact Email *"
        placeholder="Enter contact email"
        description="Email address for team-related communications."
        icon={<Mail className="h-4 w-4 text-muted-foreground" />}
        type="email"
        disabled={disabled}
      />
    </div>
  )
}
