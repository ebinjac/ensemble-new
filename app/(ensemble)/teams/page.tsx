import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TeamAccess } from '@/app/types/auth';

export default async function TeamsPage() {
  const user = await requireAuth();
  const teams = user.teams || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Link href="/teams/register">
          <Button>Register New Team</Button>
        </Link>
      </div>
      
      {teams.length === 0 ? (
        <div className="text-gray-600">
          No teams found. Click "Register New Team" to create your first team.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team: TeamAccess) => (
            <Card key={team.teamId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{team.teamName}</CardTitle>
                  <Badge variant={team.role === 'admin' ? 'default' : 'secondary'}>
                    {team.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/teams/${team.teamId}`}>
                  <Button variant="outline" className="w-full">
                    View Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 