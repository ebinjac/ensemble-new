// components/applications/PermissionGuard.tsx
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PermissionGuardProps {
  canCreate: boolean
  children: React.ReactNode
}

export function PermissionGuard({ canCreate, children }: PermissionGuardProps) {
  if (!canCreate) {
    return (
      <Button disabled title="Only team admins can add applications">
        <Plus className="mr-2 h-4 w-4" />
        New Application
      </Button>
    )
  }

  return <>{children}</>
}
