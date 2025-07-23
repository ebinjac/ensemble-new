// components/teams/AccessGroupsSection.tsx
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Control } from "react-hook-form"
import type { TeamFormValues } from "@/lib/teamFormSchema"

interface AccessGroupsSectionProps {
  control: Control<TeamFormValues>
  disabled?: boolean
}

export function AccessGroupsSection({ control, disabled }: AccessGroupsSectionProps) {
  return (
    <>
      <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These should be Active Directory security groups that will be used to control access to your team's resources.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="userGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">User Group *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., SSO_TEAM_USERS" 
                  {...field} 
                  className="bg-muted/30" 
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>AD group for regular team members with read access.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="adminGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Admin Group *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., SSO_TEAM_ADMINS" 
                  {...field} 
                  className="bg-muted/30" 
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>AD group for team administrators with full access.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
