// components/applications/SuccessIndicator.tsx
import { CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SuccessIndicator() {
  return (
    <div className="flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-500">
      <CheckCircle className="h-5 w-5 text-green-600" />
      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
        Application Found
      </Badge>
    </div>
  )
}
