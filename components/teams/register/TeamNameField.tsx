// components/teams/TeamNameField.tsx
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Control } from "react-hook-form"
import type { TeamFormValues } from "@/lib/teamFormSchema"

interface TeamNameFieldProps {
  control: Control<TeamFormValues>
  isCheckingName: boolean
  isNameAvailable: boolean | null
  disabled?: boolean
}

export function TeamNameField({ control, isCheckingName, isNameAvailable, disabled }: TeamNameFieldProps) {
  function getIcon() {
    if (isCheckingName) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    if (isNameAvailable === true) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (isNameAvailable === false) return <XCircle className="h-4 w-4 text-destructive" />
    return null
  }

  function getMessage() {
    if (isCheckingName) return "Checking availability..."
    if (isNameAvailable === false) return "This team name is already taken"
    if (isNameAvailable === true) return "Team name is available"
    return "This will be your team's display name."
  }

  return (
    <FormField
      control={control}
      name="teamName"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">Team Name *</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                placeholder="Enter team name (e.g., 'Data Analytics Team')"
                {...field}
                className={`pr-10 ${
                  isNameAvailable === false
                    ? "border-destructive focus-visible:ring-destructive"
                    : isNameAvailable === true
                      ? "border-green-500 focus-visible:ring-green-500"
                      : ""
                }`}
                disabled={disabled}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{getIcon()}</div>
            </div>
          </FormControl>
          <FormDescription
            className={`${
              isNameAvailable === false
                ? "text-destructive"
                : isNameAvailable === true
                  ? "text-green-600"
                  : "text-muted-foreground"
            }`}
          >
            {getMessage()}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
