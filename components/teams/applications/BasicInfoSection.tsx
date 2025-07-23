// components/applications/BasicInfoSection.tsx (Updated)
import { Building2, Hash } from "lucide-react"
import { Control } from "react-hook-form"
import { type ApplicationFormData } from "@/app/types/application"
import { AppFormField, NumberFormField } from "./FormFields"

interface BasicInfoSectionProps {
  control: Control<ApplicationFormData>
}

export function BasicInfoSection({ control }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Building2 className="h-5 w-5 text-primary" />
        Basic Information
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppFormField
          control={control}
          name="applicationName"
          label="Application Name"
        />
        <AppFormField
          control={control}
          name="tla"
          label="TLA"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NumberFormField
          control={control}
          name="tier"
          label="Tier"
          icon={<Hash className="h-4 w-4" />}
        />
        <AppFormField
          control={control}
          name="description"
          label="Description"
        />
      </div>
    </div>
  )
}
