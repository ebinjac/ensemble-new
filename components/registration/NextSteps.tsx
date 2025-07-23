// components/registration/NextSteps.tsx
import { Clock, Mail, Users } from "lucide-react"

const steps = [
  {
    icon: Clock,
    title: "Review Process",
    description: "Our administrators will review your request within 1-2 business days."
  },
  {
    icon: Mail,
    title: "Notification", 
    description: "You'll receive an email notification once your request is processed."
  },
  {
    icon: Users,
    title: "Team Access",
    description: "Upon approval, your team will be activated and ready to use."
  }
]

export function NextSteps() {
  return (
    <div className="border-t border-border pt-12">
      <div className="text-center space-y-6">
        <h3 className="text-xl font-semibold text-foreground">What Happens Next?</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full border border-border">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium text-foreground">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
