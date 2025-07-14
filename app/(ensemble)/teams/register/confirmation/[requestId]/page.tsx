import { getRegistrationRequestById } from "@/app/actions/teams";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function RegistrationConfirmationPage({
  params,
}: {
  params: { requestId: string };
}) {
  // Ensure user is authenticated
  await requireAuth();
  
  // Get registration request details
  const request = await getRegistrationRequestById(params.requestId);
  
  if (!request) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Registration Request Received</CardTitle>
          <CardDescription>
            Thank you for submitting your team registration request. Here are the details of your submission:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Team Name</h3>
              <p className="text-sm text-muted-foreground">{request.teamName}</p>
            </div>
            <div>
              <h3 className="font-medium">User Group</h3>
              <p className="text-sm text-muted-foreground">{request.userGroup}</p>
            </div>
            <div>
              <h3 className="font-medium">Admin Group</h3>
              <p className="text-sm text-muted-foreground">{request.adminGroup}</p>
            </div>
            <div>
              <h3 className="font-medium">Contact Information</h3>
              <p className="text-sm text-muted-foreground">
                {request.contactName} ({request.contactEmail})
              </p>
            </div>
            <div>
              <h3 className="font-medium">Status</h3>
              <p className="text-sm text-muted-foreground capitalize">{request.status}</p>
            </div>
            <div>
              <h3 className="font-medium">Submitted On</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(request.requestedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Your request is now pending approval. You will be notified once an administrator reviews your request.
              You can check the status of your request using this page at any time.
            </p>
            <Button asChild>
              <Link href="/teams">Return to Teams</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 