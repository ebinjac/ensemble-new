// components/teams/UserInfoCard.tsx
import { FormattedUser } from "@/app/(auth)/lib/auth"
import { User } from "lucide-react"


interface UserInfoCardProps {
  user: FormattedUser
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  return (
    <div className="p-4 bg-secondary/30 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">Employee ID: {user.employeeId}</p>
        </div>
      </div>
    </div>
  )
}
