// components/registration/ActionButtons.tsx
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ActionButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
      <Button asChild size="lg">
        <Link href="/teams">Return to Teams Dashboard</Link>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href="/teams/register">Submit Another Request</Link>
      </Button>
    </div>
  )
}
