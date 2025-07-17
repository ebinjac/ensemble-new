import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applications } from "@/db/schema";

interface ApplicationsListProps {
  applications: typeof applications.$inferSelect[];
}

export default function ApplicationsList({ applications }: ApplicationsListProps) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <h3 className="text-lg font-semibold">No applications yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first application to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {applications.map((app) => (
        <Card key={app.id} className="group hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{app.applicationName}</CardTitle>
                <CardDescription className="mt-1">
                  {app.description || "No description provided"}
                </CardDescription>
              </div>
              <Badge variant={app.status === "active" ? "default" : "secondary"}>
                {app.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">CAR ID:</span>
                  <span className="ml-2 text-muted-foreground">{app.carId}</span>
                </div>
                <div>
                  <span className="font-medium">TLA:</span>
                  <span className="ml-2 text-muted-foreground">{app.tla}</span>
                </div>
                <div>
                  <span className="font-medium">Tier:</span>
                  <span className="ml-2 text-muted-foreground">{app.tier}</span>
                </div>
                {app.slackChannel && (
                  <div>
                    <span className="font-medium">Slack:</span>
                    <span className="ml-2 text-muted-foreground">#{app.slackChannel}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <Link href={`/applications/${app.id}`}>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 