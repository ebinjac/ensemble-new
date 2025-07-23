// components/applications/LeadershipSection.tsx
import { User, Mail } from "lucide-react"
import { Control } from "react-hook-form"
import { type ApplicationFormData } from "@/app/types/application"
import { FormSection } from "@/components/ui/form-section"
import { AppFormField } from "./FormFields"

interface LeadershipSectionProps {
  control: Control<ApplicationFormData>
}

export function LeadershipSection({ control }: LeadershipSectionProps) {
  return (
    <FormSection title="Leadership Team" icon={<User className="h-5 w-5 text-primary" />}>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <AppFormField
            control={control}
            name="vpName"
            label="VP Name"
          />
          <AppFormField
            control={control}
            name="vpEmail"
            label="VP Email"
            type="email"
            icon={<Mail className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <AppFormField
            control={control}
            name="directorName"
            label="Director Name"
          />
          <AppFormField
            control={control}
            name="directorEmail"
            label="Director Email"
            type="email"
            icon={<Mail className="h-4 w-4" />}
          />
        </div>
      </div>
    </FormSection>
  )
}
