import { notFound } from "next/navigation";
import { requireAuth } from "@/app/(auth)/lib/auth";
import { db } from "@/db";
import { teams, applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ApplicationsList from "@/components/teams/applications-list";
import TeamSettings from '@/components/teams/register/TeamSettings';
import NewApplicationDialog from "@/components/teams/applications/NewApplicationDialog";

async function getTeamData(teamId: string) {
  const user = await requireAuth();
  
  // Check if user has access to this team
  const hasTeamAccess = user.teams?.some(team => team.teamId === teamId);
  if (!hasTeamAccess) {
    return null;
  }

  // First fetch team details
  const team = await db.select().from(teams).where(eq(teams.id, teamId)).execute();
  if (!team.length) {
    return null;
  }

  // Then fetch applications for this team
  const teamApplications = await db.select().from(applications).where(eq(applications.teamId, teamId)).execute();

  // Combine the data
  return {
    ...team[0],
    applications: teamApplications
  };
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDashboard({ params }: PageProps) {
  // Await the params object
  const { teamId } = await params;

  // Validate teamId parameter
  if (!teamId) {
    return notFound();
  }

  const teamDetails = await getTeamData(teamId);
  const user = await requireAuth();
  const isAdmin = user.teams?.some(team => team.teamId === teamId && team.role === 'admin');

  if (!teamDetails) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{teamDetails.teamName}</h1>
          <p className="text-muted-foreground">Manage your team's applications and settings</p>
        </div>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="settings">Team Settings</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Applications</h2>
              <p className="text-sm text-muted-foreground">
                Manage your team's applications and their configurations
              </p>
            </div>
            <NewApplicationDialog teamId={teamId} />
          </div>
          
          <ApplicationsList applications={teamDetails.applications} />
        </TabsContent>

        <TabsContent value="settings">
          <TeamSettings teamDetails={teamDetails} isAdmin={isAdmin} teamId={teamId} />
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                View and manage team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Members of this group have access to the portal. To get access, raise an IIQ request to get access to the team.
              </p>
              {/* Placeholder for members list */}
              <ul className="list-disc pl-6 text-sm text-muted-foreground">
                <li>Member management coming soon...</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 