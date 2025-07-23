// components/applications/NewApplicationDialog.tsx
"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useNewApplication } from "@/hooks/useNewApplication"
import { PermissionGuard } from "./PermissionGuard"
import { SearchSection } from "./SearchSection"
import { SuccessIndicator } from "./SuccessIndicator"
import { BasicInfoSection } from "./BasicInfoSection"
import { LeadershipSection } from "./LeadershipSection"
import { CommunicationSection } from "./CommunicationSection"

interface NewApplicationDialogProps {
  teamId: string
}

export default function NewApplicationDialog({ teamId }: NewApplicationDialogProps) {
  const [open, setOpen] = useState(false)

  const {
    form,
    onSubmit,
    resetForm,
    searchByCarId,
    carIdValue,
    isSearching,
    isSubmitting,
    applicationData,
    canCreateApplication,
    router,
  } = useNewApplication(teamId)

  const handleSubmit = async () => {
    const success = await onSubmit(form.getValues())
    if (success) {
      setOpen(false)
      router.refresh()
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetForm()
    }
  }

  return (
    <PermissionGuard canCreate={canCreateApplication}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </DialogTrigger>

        <DialogContent className=" min-w-[700px] max-h-[95vh] overflow-hidden flex flex-col">
          {/* Fixed Header */}
          <DialogHeader className="flex-shrink-0 pb-6">
            <DialogTitle className="text-2xl font-semibold">
              Add New Application
            </DialogTitle>
            <DialogDescription className="text-base">
              Search for an application by CAR ID and add it to your team
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}

          <div className="space-y-8 pb-6 px-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 px-2">
                {/* Search Section */}
                <SearchSection
                  control={form.control}
                  carIdValue={carIdValue}
                  onSearch={searchByCarId}
                  isSearching={isSearching}
                />
                <ScrollArea className="h-[50vh]  rounded-md p-4">
                  {/* Application Details */}
                  {applicationData && (
                    <div className="space-y-8">
                      <SuccessIndicator />
                      <BasicInfoSection control={form.control} />
                      <LeadershipSection control={form.control} />
                      <CommunicationSection control={form.control} />
                    </div>
                  )}
                </ScrollArea>

              </form>
            </Form>
          </div>


          {/* Sticky Footer */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-6 border-t bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
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
    </PermissionGuard>
  )
}
