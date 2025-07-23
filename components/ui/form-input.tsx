// components/ui/FormInput.tsx
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ReactNode } from "react"
import { Control, FieldPath, FieldValues } from "react-hook-form"

interface FormInputProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
  type?: string
  className?: string
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  icon,
  disabled,
  type = "text",
  className = "bg-muted/30",
}: FormInputProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  {icon}
                </div>
              )}
              <Input 
                placeholder={placeholder}
                type={type}
                {...field} 
                className={`${icon ? 'pl-10' : ''} ${className}`}
                disabled={disabled}
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
