// components/applications/FormFields.tsx
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Control } from "react-hook-form"
import { type ApplicationFormData } from "@/app/types/application"
import { ReactNode } from "react"

interface FormFieldProps {
  control: Control<ApplicationFormData>
  name: keyof ApplicationFormData
  label: string
  placeholder?: string
  type?: string
  icon?: ReactNode
}

export function AppFormField({ control, name, label, placeholder, type = "text", icon }: FormFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem >
          <FormLabel className="text-sm font-medium flex items-center gap-2">
            {icon}
            {label}
          </FormLabel>
          <FormControl>
            <Input 
              {...field} 
              type={type}
              placeholder={placeholder}
              className="h-11" 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function NumberFormField({ control, name, label, icon }: Omit<FormFieldProps, 'type' | 'placeholder'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem >
          <FormLabel className="text-sm font-medium flex items-center gap-2">
            {icon}
            {label}
          </FormLabel>
          <FormControl>
            <Input 
              type="number"
              {...field}
              className="h-11" 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
