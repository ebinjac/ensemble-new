import { TeamRegistrationForm } from "@/components/teams/TeamRegistrationForm"
import { requireAuth } from "@/lib/auth"
import type { SSOUser } from "@/app/types/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Mail,
  FileText,
  ArrowRight,
  Info,
  CheckCircle2,
  Users,
  Shield,
  UserCheck,
  Rocket,
} from "lucide-react"
import Link from "next/link"

export default async function TeamRegistrationPage() {
  const jwt = await requireAuth()
  const user: SSOUser = {
    ...jwt.user,
    groups: jwt.groups,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            Team Onboarding
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Register a New Team</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Follow our simple process to get your team onboarded to Ensemble. Complete the form below and we'll guide
            you through the rest.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Registration Form */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Team Registration</CardTitle>
                  <CardDescription>Provide your team details to get started</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <TeamRegistrationForm user={user} />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
