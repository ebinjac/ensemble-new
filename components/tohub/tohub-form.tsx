// app/(tools)/tools/teams/[teamId]/tohub/components/TurnoverForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationTabs } from '@/components/tohub/tohub-applications-tab';
import HandoverSection from '@/components/tohub/tohub-handover-section';
import DynamicEntrySection from '@/components/tohub/tohub-dynamic-entry';
import { SECTION_CONFIGS } from '@/components/tohub/config/sessionConfig';
import {
    fetchCurrentSession,
    fetchSubApplicationsByTeam
} from '@/app/actions/tohub/tohub';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    teamId: string;
    applications: any[];
    currentAppId: string;
    userRole: 'admin' | 'member'; // ✅ Added userRole prop
}

function SectionSkeleton() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function TurnoverForm({ teamId, applications, currentAppId, userRole }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [session, setSession] = useState<any>(null);
    const [subApps, setSubApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Get current application
    const currentApp = applications.find(app => app.id === currentAppId);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Load session and sub-applications
                const [sessionData, subAppsData] = await Promise.all([
                    fetchCurrentSession(teamId, currentAppId),
                    fetchSubApplicationsByTeam(teamId, currentAppId)
                ]);

                setSession(sessionData);
                setSubApps(subAppsData);
            } catch (error) {
                console.error('Failed to load turnover data:', error);
                toast.error('Failed to load turnover data');
            } finally {
                setLoading(false);
            }
        };

        if (currentAppId) {
            loadData();
        }
    }, [teamId, currentAppId]);

    const handleAppSwitch = (applicationId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('app', applicationId);
        router.push(`/tools/teams/${teamId}/tohub?${params.toString()}`);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Application Tabs Skeleton */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex space-x-4">
                            {applications.slice(0, 4).map((_, index) => (
                                <div key={index} className="h-10 w-24 bg-muted animate-pulse rounded" />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Sections Skeleton */}
                {[1, 2, 3, 4, 5, 6].map(i => <SectionSkeleton key={i} />)}
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Setting up turnover session...</h3>
                        <p className="text-sm text-muted-foreground">
                            Please wait while we prepare your turnover workspace.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Application Tabs */}
            <ApplicationTabs
                teamId={teamId}
                applications={applications}
                currentAppId={currentAppId}
                onAppSwitch={handleAppSwitch}
            />

            {/* Current Application Info */}
    

            {/* Handover Section */}
            <Suspense fallback={<SectionSkeleton />}>
                <HandoverSection
                    session={session}
                />
            </Suspense>

            {/* Dynamic Sections */}
            <Suspense fallback={<SectionSkeleton />}>
                <DynamicEntrySection
                    sessionId={session.id}
                    config={SECTION_CONFIGS.rfc}
                    subApplications={subApps}
                />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <DynamicEntrySection
                    sessionId={session.id}
                    config={SECTION_CONFIGS.inc}
                    subApplications={subApps}
                />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <DynamicEntrySection
                    sessionId={session.id}
                    config={SECTION_CONFIGS.alerts}
                    subApplications={subApps}
                />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <DynamicEntrySection
                    sessionId={session.id}
                    config={SECTION_CONFIGS.mim}
                    subApplications={subApps}
                />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <DynamicEntrySection
                    sessionId={session.id}
                    config={SECTION_CONFIGS.email_slack}
                    subApplications={subApps}
                />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <DynamicEntrySection
                    sessionId={session.id}
                    config={SECTION_CONFIGS.fyi}
                    subApplications={subApps}
                />
            </Suspense>
        </div>
    );
}
