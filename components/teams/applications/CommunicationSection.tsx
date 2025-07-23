// components/applications/CommunicationSection.tsx
import { Settings, MessageSquare } from "lucide-react"
import { Control } from "react-hook-form"
import { type ApplicationFormData } from "@/app/types/application"
import { FormSection } from "@/components/ui/form-section"
import { AppFormField } from "./FormFields"

interface CommunicationSectionProps {
  control: Control<ApplicationFormData>
}

export function CommunicationSection({ control }: CommunicationSectionProps) {
  return (
    <FormSection title="Communication & Tools" icon={<Settings className="h-5 w-5 text-primary" />}>
      <div className="grid grid-cols-2 gap-8">
        <AppFormField
          control={control}
          name="slackChannel"
          label="Slack Channel"
          placeholder="#channel-name"
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <AppFormField
          control={control}
          name="snowGroup"
          label="ServiceNow Group"
        />
      </div>
    </FormSection>
  )
}
