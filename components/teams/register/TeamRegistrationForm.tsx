// components/teams/TeamRegistrationForm.tsx
"use client"

import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users, Shield, Mail, Loader2, AlertCircle, Info } from "lucide-react"

import { useTeamRegistration } from "@/hooks/useTeamRegistration"
import { UserInfoCard } from "@/components/teams/register/UserInfoCard"
import { StatusAlerts } from "@/components/teams/register/StatusAlerts"
import { FormSection } from "@/components/teams/register/RegisterFormSection"
import { TeamNameField } from "@/components/teams/register/TeamNameField"
import { AccessGroupsSection } from "@/components/teams/register/AccessGroupSection"
import { ContactSection } from "@/components/teams/register/ContactSection"


export function TeamRegistrationForm() {
  const {
    form,
    onSubmit,
    user,
    isAuthenticated,
    authLoading,
    authError,
    isCheckingName,
    isNameAvailable,
    registrationStatus,
    isSubmitting,
    submitError,
    canSubmit,
  } = useTeamRegistration()

  // Loading state
  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (authError) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert className="border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-destructive">Authentication Error</AlertTitle>
          <AlertDescription className="text-destructive/90">
            {authError}. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Unauthenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert className="border-orange-200 bg-orange-50">
          <Info className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to register a new team.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Team Registration Details</h2>
        <p className="text-muted-foreground">
          Create a new team and set up access groups. Your request will be reviewed by an administrator.
        </p>
      </div>

      {/* User Info */}
      <UserInfoCard user={user} />

      {/* Status Alerts */}
      <StatusAlerts submitError={submitError} registrationStatus={registrationStatus} />

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Team Information */}
          <FormSection title="Team Information" icon={<Users className="h-5 w-5 text-primary" />}>
            <TeamNameField
              control={form.control}
              isCheckingName={isCheckingName}
              isNameAvailable={isNameAvailable}
              disabled={isSubmitting}
            />
          </FormSection>

          {/* Access Groups */}
          <FormSection title="Access Groups" icon={<Shield className="h-5 w-5 text-primary" />}>
            <AccessGroupsSection control={form.control} disabled={isSubmitting} />
          </FormSection>

          {/* Contact Information */}
          <FormSection title="Contact Information" icon={<Mail className="h-5 w-5 text-primary" />}>
            <ContactSection control={form.control} disabled={isSubmitting} />
          </FormSection>

          {/* Submit */}
          <div className="pt-6 border-t border-border">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                "Submit Registration Request"
              )}
            </Button>
            
            {!canSubmit && !isSubmitting && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Please resolve all issues before submitting.
              </p>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
