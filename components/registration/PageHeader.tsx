// components/registration/EnhancedPageHeader.tsx
import { CheckCircle2, ArrowRight, XCircle, Clock, AlertTriangle } from "lucide-react"
import type { RegistrationStatus } from "@/lib/registrationUtils"

interface PageHeaderProps {
  status: RegistrationStatus
}

export function PageHeader({ status }: PageHeaderProps) {
  const getStepsConfiguration = () => {
    const baseSteps = [
      {
        id: 'registration',
        label: 'Registration',
        isComplete: true,
        className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        icon: <CheckCircle2 className="w-2 h-2" />
      }
    ]

    switch (status) {
      case 'approved':
        return [
          ...baseSteps,
          {
            id: 'review',
            label: 'Review',
            isComplete: true,
            className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            icon: <CheckCircle2 className="w-2 h-2" />
          },
          {
            id: 'activation',
            label: 'Activation',
            isComplete: true,
            className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            icon: <CheckCircle2 className="w-2 h-2" />
          }
        ]

      case 'rejected':
        return [
          ...baseSteps,
          {
            id: 'review',
            label: 'Review',
            isComplete: true,
            className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            icon: <CheckCircle2 className="w-2 h-2" />
          },
          {
            id: 'rejected',
            label: 'Rejected',
            isComplete: true,
            className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            icon: <XCircle className="w-2 h-2" />
          }
        ]

      default: // pending
        return [
          ...baseSteps,
          {
            id: 'review',
            label: 'Review (In Progress)',
            isComplete: false,
            className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            icon: <Clock className="w-2 h-2 animate-pulse" />
          },
          {
            id: 'activation',
            label: 'Activation',
            isComplete: false,
            className: 'bg-muted text-muted-foreground',
            icon: <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
          }
        ]
    }
  }

  const steps = getStepsConfiguration()

  return (
    <div className="text-center space-y-6 mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-6 border border-border">
        <CheckCircle2 className="h-4 w-4" />
        Registration Submitted
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl font-bold text-foreground leading-tight">
          {status === 'approved' ? 'Team Registration Approved!' :
           status === 'rejected' ? 'Registration Decision Made' :
           'Request Received Successfully'}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {status === 'approved' 
            ? 'Congratulations! Your team registration has been approved and your team is now active.'
            : status === 'rejected'
            ? 'Your team registration request has been reviewed and a decision has been made.'
            : 'Thank you for submitting your team registration request. Your application is now under review by our administrators.'}
        </p>
      </div>

      {/* Dynamic Process Steps */}
      <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${step.className}`}>
              {step.icon}
              Step {index + 1}: {step.label}
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
