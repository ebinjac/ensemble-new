"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Loader2, Building2, User, Mail, Hash, MessageSquare, Settings, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createApplication, searchCarId } from "@/app/actions/applications"
import { type ApplicationFormData, applicationSchema } from "@/app/types/application"
import { useAuth } from "@/app/(auth)/providers/AuthProvider"

interface NewApplicationDialogProps {
  teamId: string
}

export default function NewApplicationDialog({ teamId }: NewApplicationDialogProps) {
  const { isTeamAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationFormData | null>(null)
  const router = useRouter()

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      teamId,
      carId: "",
    },
  })

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
        toast("Application Found. Review the details below and click 'Create Application'.")
      } else {
        toast.error(result.error || "Failed to fetch application details")
      }
    } catch (error) {
      toast.error("Failed to fetch application details.")
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
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create application")
      }
    } catch (error) {
      toast.error("Failed to create application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const carIdValue = form.watch("carId")

  // Only show the dialog trigger if user is admin
  if (!isTeamAdmin(teamId)) {
    return (
      <Button disabled title="Only team admins can add applications">
        <Plus className="mr-2 h-4 w-4" />
        New Application
      </Button>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          form.reset()
          setApplicationData(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold">Add New Application</DialogTitle>
          <DialogDescription className="text-base">
            Search for an application by CAR ID and add it to your team
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pr-6 -mr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              {/* Search Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                  <Search className="h-5 w-5" />
                  Search Application
                </div>

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="carId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder="Enter CAR ID (e.g., CAR-12345)" className="h-11 text-base" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => searchByCarId(carIdValue)}
                    disabled={isSearching || !carIdValue}
                    className="h-11 px-8"
                  >
                    {isSearching ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-5 w-5" />
                    )}
                    Search
                  </Button>
                </div>

                {isSearching && (
                  <div className="flex items-center justify-center py-10">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Searching for application...</span>
                    </div>
                  </div>
                )}
              </div>

              {applicationData && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      Application Found
                    </Badge>
                  </div>

                  <Separator />

                  {/* Basic Information Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Building2 className="h-5 w-5 text-primary" />
                      Basic Information
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="applicationName"
                        render={({ field }) => (
                          <FormItem className="space-y-2.5">
                            <FormLabel className="text-sm font-medium">Application Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tla"
                        render={({ field }) => (
                          <FormItem className="space-y-2.5">
                            <FormLabel className="text-sm font-medium">TLA</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="tier"
                        render={({ field }) => (
                          <FormItem className="space-y-2.5">
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              Tier
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="space-y-2.5">
                            <FormLabel className="text-sm font-medium">Description</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Leadership Team Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <User className="h-5 w-5 text-primary" />
                      Leadership Team
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="vpName"
                          render={({ field }) => (
                            <FormItem className="space-y-2.5">
                              <FormLabel className="text-sm font-medium">VP Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vpEmail"
                          render={({ field }) => (
                            <FormItem className="space-y-2.5">
                              <FormLabel className="text-sm font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                VP Email
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="email" className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="directorName"
                          render={({ field }) => (
                            <FormItem className="space-y-2.5">
                              <FormLabel className="text-sm font-medium">Director Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="directorEmail"
                          render={({ field }) => (
                            <FormItem className="space-y-2.5">
                              <FormLabel className="text-sm font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Director Email
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="email" className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Communication & Tools Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Settings className="h-5 w-5 text-primary" />
                      Communication & Tools
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="slackChannel"
                        render={({ field }) => (
                          <FormItem className="space-y-2.5">
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Slack Channel
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="#channel-name" className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="snowGroup"
                        render={({ field }) => (
                          <FormItem className="space-y-2.5">
                            <FormLabel className="text-sm font-medium">ServiceNow Group</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-8 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} size="lg">
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={!applicationData || isSubmitting}
            size="lg"
            className="px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Create Application
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
