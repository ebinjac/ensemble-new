import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Mail } from 'lucide-react';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getTeamTemplates } from '@/app/actions/bluemailer/templates';
import { getTeamApplications } from '@/app/actions/applications';
import { getSharedTemplates } from '@/app/actions/bluemailer/sharing';
import { TemplateList } from '@/components/bluemailer/template-list';
import { TeamSwitcher } from '@/components/bluemailer/team-switcher';
import { TemplateStats } from '@/components/bluemailer/template-stats';
import Link from 'next/link';

interface BluemailerPageProps {
    params: {
        teamId: string;
    };
}

export default async function BluemailerPage({ params }: BluemailerPageProps) {
    const { teamId } = params;

    // Verify team access
    const { user } = await requireTeamAccess(teamId);

    // Fetch data in parallel
    const [templates, applications, sharedTemplates] = await Promise.all([
        getTeamTemplates(teamId),
        getTeamApplications(teamId),
        getSharedTemplates(teamId),
    ]);

    return (

            <div className=" mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-6 w-6 text-blue-600" />
                                <h1 className="text-2xl font-bold">Bluemailer</h1>
                            </div>
                            <TeamSwitcher />
                        </div>
                        <p className="text-muted-foreground">
                            Create and manage email templates for your team
                        </p>
                    </div>

                    <Link href={`/tools/teams/${teamId}/bluemailer/new`}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Template
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <TemplateStats
                    templates={templates}
                    applications={applications}
                />

                {/* Template List */}
                <Suspense fallback={<div>Loading templates...</div>}>
                    <TemplateList
                        templates={templates}
                        sharedTemplates={sharedTemplates}
                        applications={applications}
                        teamId={teamId}
                    />
                </Suspense>
            </div>

    );
}

export async function generateMetadata({ params }: BluemailerPageProps) {
    return {
        title: 'Bluemailer - Email Templates',
        description: 'Create and manage email templates for your team',
    };
}
