// hooks/useNewApplication.ts
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createApplication, searchCarId } from '@/app/actions/applications'
import { type ApplicationFormData, applicationSchema } from '@/app/types/application'
import { useAuth } from '@/app/(auth)/providers/AuthProvider'


export function useNewApplication(teamId: string) {
  const { isTeamAdmin } = useAuth()
  const router = useRouter()
  
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationFormData | null>(null)

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      teamId,
      carId: "",
    },
  })

  const carIdValue = form.watch("carId")

  const searchByCarId = async (carId: string) => {
    if (!carId) {
      toast.error("CAR ID is required")
      return
    }

    setIsSearching(true)
    setApplicationData(null)
    
    try {
      const result = await searchCarId(carId)

      if (result.success && result.data) {
        const fullData = {
          ...form.getValues(),
          ...result.data,
          carId,
          teamId,
        }
        form.reset(fullData)
        setApplicationData(fullData)
        toast.success("Application found! Review the details below and click 'Create Application'.")
      } else {
        toast.error(result.error || "Application not found")
        setApplicationData(null)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error("Failed to search application")
    } finally {
      setIsSearching(false)
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    
    try {
      const result = await createApplication({
        ...data,
        teamId,
      })
      
      if (result.success) {
        toast.success("Application created successfully")
        return true // Indicate success
      } else {
        toast.error(result.error || "Failed to create application")
        return false
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error("Failed to create application. Please try again.")
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    form.reset({ teamId, carId: "" })
    setApplicationData(null)
  }

  return {
    // Form
    form,
    onSubmit,
    resetForm,
    
    // Search
    searchByCarId,
    carIdValue,
    
    // State
    isSearching,
    isSubmitting,
    applicationData,
    
    // Permissions
    canCreateApplication: isTeamAdmin(teamId),
    
    // Utils
    router,
  }
}
