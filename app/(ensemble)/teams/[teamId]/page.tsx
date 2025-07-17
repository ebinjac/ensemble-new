import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { teams, applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ApplicationsList from "@/components/teams/applications-list";
import NewApplicationDialog from "@/components/teams/new-application-dialog";

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

export default async function TeamDashboard({ params: { teamId } }: { params: { teamId: string } }) {
  // Validate teamId parameter
  if (!teamId) {
    return notFound();
  }

  const teamDetails = await getTeamData(teamId);

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
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Manage your team's settings and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Team Information</h3>
                  <div className="grid gap-2 mt-2">
                    <div>
                      <span className="text-sm font-medium">Team Name:</span>
                      <span className="ml-2 text-sm text-muted-foreground">{teamDetails.teamName}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">User Group:</span>
                      <span className="ml-2 text-sm text-muted-foreground">{teamDetails.userGroup}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Admin Group:</span>
                      <span className="ml-2 text-sm text-muted-foreground">{teamDetails.adminGroup}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
              {/* Team members list will be implemented later */}
              <p className="text-sm text-muted-foreground">Team members management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 