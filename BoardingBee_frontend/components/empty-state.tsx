import { Home, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Shown when there are no listings
export function EmptyState() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Home className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You haven't created any listings yet. Start by creating your first boarding listing.
      </p>
      <Button onClick={() => router.push("/owner/listings/create")}>
        <Plus className="h-4 w-4 mr-2" />
        Create Your First Listing
      </Button>
    </div>
  )
}