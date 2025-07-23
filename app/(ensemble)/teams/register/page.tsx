import { TeamRegistrationForm } from "@/components/teams/register/TeamRegistrationForm"
import { Button } from "@/components/ui/button"
import { MessageSquare, FileText, ArrowRight, Users, UserCheck, Rocket } from "lucide-react"

export default async function TeamRegistrationPage() {

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-6 border border-border">
            <Users className="h-4 w-4" />
            Team Onboarding
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground leading-tight tracking-tight">Kickstart Your Team Setup</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Follow our streamlined process to get your team onboarded to Ensemble. Complete the form below and we'll
              guide you through the rest of your journey.
            </p>
          </div>

          {/* Process Steps Indicator */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Step 1: Registration
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm font-medium text-muted-foreground">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
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

          {/* Registration Form Section */}
          <div className="space-y-8">
            <div className="border-b border-border pb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-border">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-foreground">Team Registration</h2>
                  <p className="text-muted-foreground text-base">
                    Provide your team details to get started with Ensemble
                  </p>
                </div>
              </div>
            </div>

            <div className=" rounded-lg py-12 border border-border">
              <TeamRegistrationForm />
            </div>
          </div>

          {/* Help Section */}
          <div className="border-t border-border pt-12">
            <h3 className="text-xl font-semibold text-foreground mb-8 text-center">Need Assistance?</h3>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4 p-6 rounded-lg bg-muted/20 border border-border hover:bg-muted/40 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full border border-border">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Need Help?</h4>
                  <p className="text-sm text-muted-foreground">
                    Our support team is here to assist you with the registration process.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Contact Support
                </Button>
              </div>

              <div className="text-center space-y-4 p-6 rounded-lg bg-muted/20 border border-border hover:bg-muted/40 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full border border-border">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Documentation</h4>
                  <p className="text-sm text-muted-foreground">Learn more about team management and best practices.</p>
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  View Docs
                </Button>
              </div>

              <div className="text-center space-y-4 p-6 rounded-lg bg-muted/20 border border-border hover:bg-muted/40 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full border border-border">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Quick Start</h4>
                  <p className="text-sm text-muted-foreground">
                    Get up and running quickly with our step-by-step guide.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Quick Start
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
