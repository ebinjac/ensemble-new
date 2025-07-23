// lib/registrationUtils.ts
import { CheckCircle2, Clock, XCircle } from "lucide-react"

export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

export function getStatusIcon(status: RegistrationStatus) {
  switch (status.toLowerCase()) {
    case "approved":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case "rejected":
      return <XCircle className="h-5 w-5 text-destructive" />
    case "pending":
    default:
      return <Clock className="h-5 w-5 text-primary" />
  }
}

export function getStatusColor(status: RegistrationStatus) {
  switch (status.toLowerCase()) {
    case "approved":
      return "border-l-green-500 bg-green-50/50"
    case "rejected":
      return "border-l-destructive bg-destructive/5"
    case "pending":
    default:
      return "border-l-primary bg-primary/5"
  }
}

export function getStatusMessage(status: RegistrationStatus) {
  switch (status) {
    case "pending":
      return "Your request is currently being reviewed by our administrators. You will be notified once a decision is made."
    case "approved":
      return "Congratulations! Your team registration has been approved. You can now start using your team resources."
    case "rejected":
      return "Your team registration request was not approved. Please contact support for more information and next steps."
  }
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
