// components/registration/RegistrationDetails.tsx
import { Building, Shield, User, Calendar } from "lucide-react"
import { DetailSection } from "./DetailSection"
import { InfoCard, InfoRow } from "./InfoCard"
import { formatDate } from "@/lib/registrationUtils"

interface RegistrationDetailsProps {
  request: {
    teamName: string
    userGroup: string
    adminGroup: string
    contactName: string
    contactEmail: string
    requestedAt: Date | string
  }
  requestId: string
}

export function RegistrationDetails({ request, requestId }: RegistrationDetailsProps) {
  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Registration Details</h2>
        <p className="text-muted-foreground">
          Review the information submitted with your team registration request.
        </p>
      </div>

      {/* Team Information */}
      <DetailSection title="Team Information" icon={<Building className="h-5 w-5 text-primary" />}>
        <InfoCard>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Team Name" value={request.teamName} />
            <InfoRow label="Request ID" value={requestId} isMono />
          </div>
        </InfoCard>
      </DetailSection>

      {/* Access Groups */}
      <DetailSection title="Access Groups" icon={<Shield className="h-5 w-5 text-primary" />}>
        <InfoCard>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label="User Group" value={request.userGroup} isMono />
            <InfoRow label="Admin Group" value={request.adminGroup} isMono />
          </div>
        </InfoCard>
      </DetailSection>

      {/* Contact Information */}
      <DetailSection title="Contact Information" icon={<User className="h-5 w-5 text-primary" />}>
        <InfoCard>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Contact Name" value={request.contactName} />
            <InfoRow label="Contact Email" value={request.contactEmail} />
          </div>
        </InfoCard>
      </DetailSection>

      {/* Submission Details */}
      <DetailSection title="Submission Details" icon={<Calendar className="h-5 w-5 text-primary" />}>
        <InfoCard>
          <InfoRow label="Submitted On" value={formatDate(request.requestedAt)} />
        </InfoCard>
      </DetailSection>
    </div>
  )
}
