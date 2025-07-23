// components/registration/StatusAlert.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getStatusIcon, getStatusColor, getStatusMessage, type RegistrationStatus } from "@/lib/registrationUtils"

interface StatusAlertProps {
  status: RegistrationStatus
}

export function StatusAlert({ status }: StatusAlertProps) {
  return (
    <Alert className={`border-l-4 ${getStatusColor(status)}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon(status)}
        <AlertTitle className="text-foreground font-semibold">
          Request Status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </AlertTitle>
      </div>
      <AlertDescription className="text-muted-foreground mt-2">
        {getStatusMessage(status)}
      </AlertDescription>
    </Alert>
  )
}
