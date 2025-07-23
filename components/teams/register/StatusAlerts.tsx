// components/teams/StatusAlerts.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

interface StatusAlertsProps {
  submitError?: string | null
  registrationStatus?: string | null
}

export function StatusAlerts({ submitError, registrationStatus }: StatusAlertsProps) {
  return (
    <>
      {submitError && (
        <Alert className="border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-destructive">Submission Error</AlertTitle>
          <AlertDescription className="text-destructive/90">{submitError}</AlertDescription>
        </Alert>
      )}

      {registrationStatus && (
        <Alert className={`border-l-4 ${
          registrationStatus === "approved" ? "border-l-green-500 bg-green-50/50"
          : registrationStatus === "rejected" ? "border-l-destructive bg-destructive/5"
          : "border-l-primary bg-primary/5"
        }`}>
          <AlertTitle className="text-foreground font-semibold">Existing Registration Status</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {registrationStatus === "pending" && "A team registration request with this name is already pending approval."}
            {registrationStatus === "approved" && "A team with this name has already been approved and exists in the system."}
            {registrationStatus === "rejected" && "A previous team registration request with this name was rejected. Please contact support for more information."}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
