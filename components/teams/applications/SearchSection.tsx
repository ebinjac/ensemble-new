// components/applications/SearchSection.tsx (Updated)
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Control } from "react-hook-form"
import { type ApplicationFormData } from "@/app/types/application"

interface SearchSectionProps {
  control: Control<ApplicationFormData>
  carIdValue: string
  onSearch: (carId: string) => void
  isSearching: boolean
}

export function SearchSection({ control, carIdValue, onSearch, isSearching }: SearchSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-base font-medium text-muted-foreground">
        <Search className="h-5 w-5" />
        Search Application
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <FormField
          control={control}
          name="carId"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter CAR ID (e.g., CAR-12345)" 
                  className="h-11 text-base" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          size="lg"
          onClick={() => onSearch(carIdValue)}
          disabled={isSearching || !carIdValue}
          className="h-11 px-8 whitespace-nowrap"
        >
          {isSearching ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Search className="mr-2 h-5 w-5" />
          )}
          Search
        </Button>
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching for application...</span>
          </div>
        </div>
      )}
    </div>
  )
}
