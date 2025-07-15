import { getRegistrationRequestById } from "@/app/actions/teams"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Users, ArrowRight, CheckCircle2, Clock, XCircle, Mail, Shield, Calendar, User, Building } from "lucide-react"

export default async function RegistrationConfirmationPage({
  params,
}: {
  params: { requestId: string }
}) {
  // Ensure user is authenticated
  await requireAuth()

  // Get registration request details
  const request = await getRegistrationRequestById(params.requestId)

  if (!request) {
    notFound()
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-6 border border-border">
            <CheckCircle2 className="h-4 w-4" />
            Registration Submitted
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground leading-tight">Request Received Successfully</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Thank you for submitting your team registration request. Your application is now under review by our
              administrators. Here are the details of your submission.
            </p>
          </div>

          {/* Process Steps Indicator */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full text-sm font-medium text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-2 h-2" />
              Step 1: Registration
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Step 2: Review
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm font-medium text-muted-foreground">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
              Step 3: Activation
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Status Alert */}
          <Alert className={`border-l-4 ${getStatusColor(request.status)}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon(request.status)}
              <AlertTitle className="text-foreground font-semibold">
                Request Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </AlertTitle>
            </div>
            <AlertDescription className="text-muted-foreground mt-2">
              {request.status === "pending" &&
                "Your request is currently being reviewed by our administrators. You will be notified once a decision is made."}
              {request.status === "approved" &&
                "Congratulations! Your team registration has been approved. You can now start using your team resources."}
              {request.status === "rejected" &&
                "Your team registration request was not approved. Please contact support for more information and next steps."}
            </AlertDescription>
          </Alert>

          {/* Registration Details */}
          <div className="space-y-8">
            <div className="border-b border-border pb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Registration Details</h2>
              <p className="text-muted-foreground">
                Review the information submitted with your team registration request.
              </p>
            </div>

            {/* Team Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Team Information</h3>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Team Name</h4>
                    <p className="text-muted-foreground">{request.teamName}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Request ID</h4>
                    <p className="text-muted-foreground font-mono text-sm">{params.requestId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Groups Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Access Groups</h3>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">User Group</h4>
                    <p className="text-muted-foreground font-mono text-sm">{request.userGroup}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Admin Group</h4>
                    <p className="text-muted-foreground font-mono text-sm">{request.adminGroup}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Contact Name</h4>
                    <p className="text-muted-foreground">{request.contactName}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Contact Email</h4>
                    <p className="text-muted-foreground">{request.contactEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Submission Details</h3>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Submitted On</h4>
                  <p className="text-muted-foreground">
                    {new Date(request.requestedAt).toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="border-t border-border pt-12">
            <div className="text-center space-y-6">
              <h3 className="text-xl font-semibold text-foreground">What Happens Next?</h3>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full border border-border">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-foreground">Review Process</h4>
                  <p className="text-sm text-muted-foreground">
                    Our administrators will review your request within 1-2 business days.
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full border border-border">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-foreground">Notification</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email notification once your request is processed.
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full border border-border">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-foreground">Team Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Upon approval, your team will be activated and ready to use.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button asChild size="lg">
              <Link href="/teams">Return to Teams Dashboard</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/teams/register">Submit Another Request</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
