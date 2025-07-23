// hooks/useTeamRegistration.ts
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { registerTeam, checkTeamNameAvailability, getTeamRegistrationStatus } from '@/app/actions/teams'
import { teamFormSchema, type TeamFormValues } from '@/lib/teamFormSchema'
import { useAuth } from '@/app/(auth)/providers/AuthProvider'

export function useTeamRegistration() {
  const { user, isAuthenticated, loading: authLoading, error: authError } = useAuth()
  const router = useRouter()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null)
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      teamName: "",
      userGroup: "",
      adminGroup: "",
      contactName: "",
      contactEmail: "",
    },
  })

  const teamName = form.watch("teamName")
  const debouncedTeamName = useDebounce(teamName, 500)

  // Update form when user loads
  useEffect(() => {
    if (user && isAuthenticated) {
      form.setValue("contactName", user.name)
      form.setValue("contactEmail", user.email)
    }
  }, [user, isAuthenticated, form])

  // Check team name availability
  useEffect(() => {
    async function checkName() {
      if (debouncedTeamName.length >= 3) {
        setIsCheckingName(true)
        setIsNameAvailable(null)
        try {
          const isAvailable = await checkTeamNameAvailability(debouncedTeamName)
          setIsNameAvailable(isAvailable)
        } catch (error) {
          console.error("Failed to check team name:", error)
          toast.error("Failed to check team name availability")
          setIsNameAvailable(null)
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
      if (teamName && teamName.length >= 3) {
        try {
          const status = await getTeamRegistrationStatus(teamName)
          setRegistrationStatus(status)
        } catch (error) {
          console.error("Failed to check registration status:", error)
        }
      } else {
        setRegistrationStatus(null)
      }
    }
    checkStatus()
  }, [teamName])

  async function onSubmit(values: TeamFormValues) {
    if (!isNameAvailable || values.userGroup === values.adminGroup || registrationStatus === 'pending') {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      
      const result = await registerTeam(values)

      if (result.success && result.requestId) {
        toast.success("Team registration request submitted successfully!")
        router.push(`/teams/register/confirmation/${result.requestId}`)
      } else {
        throw new Error("Failed to submit registration request")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit registration request"
      setSubmitError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    // Form
    form,
    onSubmit,
    
    // Auth state
    user,
    isAuthenticated,
    authLoading,
    authError,
    
    // Team name checking
    isCheckingName,
    isNameAvailable,
    registrationStatus,
    
    // Submission state
    isSubmitting,
    submitError,
    
    // Validation helpers
    canSubmit: isNameAvailable && registrationStatus !== 'pending' && !isSubmitting,
  }
}
