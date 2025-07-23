// app/(dashboard)/teams/register/confirmation/[requestId]/page.tsx
import { getRegistrationRequestById } from "@/app/actions/teams"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/registration/PageHeader"
import { StatusAlert } from "@/components/registration/StatusAlert"
import { RegistrationDetails } from "@/components/registration/RegistrationDetails"
import { NextSteps } from "@/components/registration/NextSteps"
import { ActionButtons } from "@/components/registration/ActionButtons"
import { requireAuth } from "@/app/(auth)/lib/auth"

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default async function RegistrationConfirmationPage({ params }: PageProps) {
  // Ensure user is authenticated - KEEP THIS for security
  await requireAuth();

  // Await the params object
  const { requestId } = await params;

  // Get registration request details
  const request = await getRegistrationRequestById(requestId);

  if (!request) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-5xl">
        <PageHeader status={request.status} />
        
        <div className="space-y-12">
          <StatusAlert status={request.status} />
          
          <RegistrationDetails 
            request={request} 
            requestId={requestId} 
          />
          
          <NextSteps />
          
          <ActionButtons />
        </div>
      </div>
    </div>
  );
}
