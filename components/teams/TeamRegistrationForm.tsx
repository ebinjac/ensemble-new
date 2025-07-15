"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { registerTeam, checkTeamNameAvailability, getTeamRegistrationStatus } from "@/app/actions/teams"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import type { SSOUser } from "@/app/types/auth"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { Loader2, CheckCircle2, XCircle, Users, Shield, Mail, User } from "lucide-react"
import { useRouter } from "next/navigation"

// Form validation schema
const teamFormSchema = z.object({
  teamName: z.string().min(3, {
    message: "Team name must be at least 3 characters.",
  }),
  userGroup: z.string().min(3, {
    message: "User group must be at least 3 characters.",
  }),
  adminGroup: z.string().min(3, {
    message: "Admin group must be at least 3 characters.",
  }),
  contactName: z.string().min(2, {
    message: "Contact name must be at least 2 characters.",
  }),
  contactEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

export type TeamFormValues = z.infer<typeof teamFormSchema>

interface TeamRegistrationFormProps {
  user: SSOUser
}

export function TeamRegistrationForm({ user }: TeamRegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null)
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null)

  // Initialize form
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      teamName: "",
      userGroup: "",
      adminGroup: "",
      contactName: user?.fullName || "",
      contactEmail: user?.email || "",
    },
  })

  const teamName = form.watch("teamName")
  const debouncedTeamName = useDebounce(teamName, 500)

  // Check team name availability
  useEffect(() => {
    async function checkName() {
      if (debouncedTeamName.length >= 3) {
        setIsCheckingName(true)
        try {
          const isAvailable = await checkTeamNameAvailability(debouncedTeamName)
          setIsNameAvailable(isAvailable)
        } catch (error) {
          console.error("Failed to check team name:", error)
        } finally {
          setIsCheckingName(false)
        }
      } else {
        setIsNameAvailable(null)
      }
    }
    checkName()
  }, [debouncedTeamName])

  // Check registration status
  useEffect(() => {
    async function checkStatus() {
      if (teamName) {
        const status = await getTeamRegistrationStatus(teamName)
        setRegistrationStatus(status)
      }
    }
    checkStatus()
  }, [teamName])

  async function onSubmit(values: TeamFormValues) {
    if (!isNameAvailable) {
      toast.error("Team name is not available")
      return
    }

    try {
      setIsSubmitting(true)
      const result = await registerTeam(values)

      if (result.success && result.requestId) {
        // Redirect to the confirmation page
        router.push(`/teams/register/confirmation/${result.requestId}`)
      }
    } catch (error) {
      console.error("Failed to register team:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit registration request")
    } finally {
      setIsSubmitting(false)
    }
  }

  function getNameAvailabilityIcon() {
    if (isCheckingName) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    if (isNameAvailable === true) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (isNameAvailable === false) return <XCircle className="h-4 w-4 text-destructive" />
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Form Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Team Registration Details</h2>
        <p className="text-muted-foreground">
          Create a new team and set up access groups for users and administrators. Your request will be reviewed by an
          administrator.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Team Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Team Information</h3>
            </div>

            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Team Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter team name"
                        {...field}
                        className={`pr-10 ${
                          isNameAvailable === false
                            ? "border-destructive focus-visible:ring-destructive"
                            : isNameAvailable === true
                              ? "border-green-500 focus-visible:ring-green-500"
                              : ""
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">{getNameAvailabilityIcon()}</div>
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
                    {isCheckingName
                      ? "Checking availability..."
                      : isNameAvailable === false
                        ? "This team name is already taken"
                        : isNameAvailable === true
                          ? "Team name is available"
                          : "This will be your team's display name."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Access Groups Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Access Groups</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="userGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">User Group</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SSO_TEAM_USERS" {...field} className="bg-muted/30" />
                    </FormControl>
                    <FormDescription>AD group for regular team members.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Admin Group</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SSO_TEAM_ADMINS" {...field} className="bg-muted/30" />
                    </FormControl>
                    <FormDescription>AD group for team administrators.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Contact Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Enter contact name" {...field} className="pl-10 bg-muted/30" />
                      </div>
                    </FormControl>
                    <FormDescription>Primary contact person for this team.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Contact Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Enter contact email" {...field} className="pl-10 bg-muted/30" />
                      </div>
                    </FormControl>
                    <FormDescription>Email address for team-related communications.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-border">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={isSubmitting || !isNameAvailable}
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
          </div>
        </form>
      </Form>

      {/* Registration Status */}
      {registrationStatus && (
        <div className="mt-8">
          <Alert
            className={`border-l-4 ${
              registrationStatus === "approved"
                ? "border-l-green-500 bg-green-50/50"
                : registrationStatus === "rejected"
                  ? "border-l-destructive bg-destructive/5"
                  : "border-l-primary bg-primary/5"
            }`}
          >
            <AlertTitle className="text-foreground font-semibold">Registration Status</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {registrationStatus === "pending" && "Your team registration request is pending approval."}
              {registrationStatus === "approved" && "Your team registration request has been approved!"}
              {registrationStatus === "rejected" &&
                "Your team registration request was rejected. Please contact support for more information."}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
