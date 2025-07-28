// app/(tools)/tools/teams/[teamId]/tohub/components/DispatchContainer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Building2,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitPullRequest,
  Bug,
  Link,
  Mail,
  Info,
  ArrowLeftRight,
  Flag,
  User,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { SECTION_CONFIGS } from '@/components/tohub/config/sessionConfig';
import { 
  fetchCurrentSession, 
  fetchSubApplicationsByTeam,
  fetchSectionEntries 
} from '@/app/actions/tohub/tohub';
import { format } from 'date-fns';

interface DispatchContainerProps {
  teamId: string;
  applications: any[];
  currentAppId: string;
  userRole: 'admin' | 'member';
  isPrintMode?: boolean;
}

interface ApplicationData {
  application: any;
  session: any;
  subApps: any[];
  sectionCounts: Record<string, number>;
  sectionsData: SectionData[];
  totalEntries: number;
  importantEntries: number;
}

interface SectionData {
  config: any;
  entries: any[];
  icon: any;
  color: string;
}

export function DispatchContainer({
  teamId,
  applications,
  currentAppId,
  userRole,
  isPrintMode = false
}: DispatchContainerProps) {
  const [applicationsData, setApplicationsData] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApps, setExpandedApps] = useState<string[]>([]);

  // Load data for all applications
  useEffect(() => {
    const loadAllApplicationsData = async () => {
      try {
        setLoading(true);
        
        const appsData = await Promise.all(
          applications.map(async (app) => {
            try {
              // Load session and sub-applications for each app
              const [sessionData, subAppsData] = await Promise.all([
                fetchCurrentSession(teamId, app.id),
                fetchSubApplicationsByTeam(teamId, app.id)
              ]);

              // Load entries for all sections for this app
              const sectionPromises = Object.values(SECTION_CONFIGS).map(async (config) => {
                const entries = await fetchSectionEntries(sessionData.id, config.section);
                return {
                  config,
                  entries,
                  icon: getSectionIcon(config.section),
                  color: getSectionColor(config.section)
                };
              });

              const sectionsData = await Promise.all(sectionPromises);
              
              // Calculate counts
              const sectionCounts: Record<string, number> = {};
              let totalEntries = 0;
              let importantEntries = 0;

              sectionsData.forEach(section => {
                sectionCounts[section.config.section] = section.entries.length;
                totalEntries += section.entries.length;
                importantEntries += section.entries.filter(entry => 
                  entry.isImportant || entry.isFlagged
                ).length;
              });

              return {
                application: app,
                session: sessionData,
                subApps: subAppsData,
                sectionCounts,
                sectionsData,
                totalEntries,
                importantEntries
              };
            } catch (error) {
              console.error(`Failed to load data for app ${app.id}:`, error);
              return {
                application: app,
                session: null,
                subApps: [],
                sectionCounts: {},
                sectionsData: [],
                totalEntries: 0,
                importantEntries: 0
              };
            }
          })
        );

        setApplicationsData(appsData);
        
        // Auto-expand applications with entries
        const appsWithEntries = appsData
          .filter(appData => appData.totalEntries > 0)
          .map(appData => appData.application.id);
        setExpandedApps(appsWithEntries);

      } catch (error) {
        console.error('Failed to load applications data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllApplicationsData();
  }, [teamId, applications]);

  const getSectionIcon = (section: string) => {
    const icons: Record<string, any> = {
      handover: ArrowLeftRight,
      rfc: GitPullRequest,
      inc: Bug,
      alerts: AlertTriangle,
      mim: Link,
      email_slack: Mail,
      fyi: Info
    };
    return icons[section] || Info;
  };

  const getSectionColor = (section: string) => {
    const colors: Record<string, string> = {
      handover: 'text-blue-600',
      rfc: 'text-purple-600',
      inc: 'text-red-600',
      alerts: 'text-orange-600',
      mim: 'text-indigo-600',
      email_slack: 'text-green-600',
      fyi: 'text-gray-600'
    };
    return colors[section] || 'text-gray-600';
  };

  const toggleAppExpansion = (appId: string) => {
    setExpandedApps(prev => 
      prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  if (loading) {
    return <DispatchSkeleton />;
  }

  const totalAppsWithEntries = applicationsData.filter(appData => appData.totalEntries > 0).length;
  const grandTotalEntries = applicationsData.reduce((sum, appData) => sum + appData.totalEntries, 0);

  return (
    <div className={`space-y-6 ${isPrintMode ? 'print-optimized' : ''}`}>
      {/* Overall Summary */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">Applications</span>
              </div>
              <div>
                <p className="font-medium">{totalAppsWithEntries} active</p>
                <p className="text-sm text-muted-foreground">
                  {applications.length} total configured
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-semibold">Session Date</span>
              </div>
              <div>
                <p className="font-medium">{format(new Date(), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-muted-foreground">Dispatch Date</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">Team</span>
              </div>
              <div>
                <p className="font-medium">Multi-Application</p>
                <p className="text-sm text-muted-foreground">Turnover</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">Total Items</span>
              </div>
              <div>
                <p className="font-medium">{grandTotalEntries} items</p>
                <p className="text-sm text-muted-foreground">across all apps</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {applicationsData.map((appData) => (
          <ApplicationCard
            key={appData.application.id}
            appData={appData}
            isExpanded={expandedApps.includes(appData.application.id)}
            onToggleExpansion={() => toggleAppExpansion(appData.application.id)}
            isPrintMode={isPrintMode}
          />
        ))}

        {/* Empty State */}
        {applicationsData.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No Applications Found</h3>
                  <p className="text-muted-foreground">
                    No applications with turnover data available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer (Print mode) */}
      {isPrintMode && (
        <div className="mt-12 pt-8 border-t print-footer">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              <strong>Generated:</strong> {format(new Date(), 'MMM dd, yyyy HH:mm')} • 
              <strong className="ml-2">Applications:</strong> {totalAppsWithEntries} • 
              <strong className="ml-2">Total Items:</strong> {grandTotalEntries}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Application Card Component
interface ApplicationCardProps {
  appData: ApplicationData;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  isPrintMode: boolean;
}

function ApplicationCard({ appData, isExpanded, onToggleExpansion, isPrintMode }: ApplicationCardProps) {
  const { application, session, sectionCounts, sectionsData, totalEntries, importantEntries } = appData;
  
  if (totalEntries === 0 && !isPrintMode) {
    return null; // Don't show applications with no entries unless in print mode
  }

  return (
    <Card className={`${isPrintMode ? 'print-section' : ''} ${totalEntries === 0 ? 'opacity-50' : ''}`}>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpansion}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between w-full">
              {/* Left: Application Details */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-xl">{application.applicationName}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span><strong>TLA:</strong> {application.tla}</span>
                    {session && (
                      <span><strong>Session:</strong> {session.id.slice(0, 8)}</span>
                    )}
                    <span><strong>Items:</strong> {totalEntries}</span>
                    {importantEntries > 0 && (
                      <span className="text-orange-600">
                        <strong>Important:</strong> {importantEntries}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Section Counts */}
              <div className="flex items-center space-x-6">
                {Object.values(SECTION_CONFIGS).map((config) => {
                  const count = sectionCounts[config.section] || 0;
                  const Icon = getSectionIcon(config.section);
                  const colorClass = getSectionColor(config.section);
                  
                  if (count === 0 && !isPrintMode) return null;
                  
                  return (
                    <div key={config.section} className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${colorClass}`} />
                      <div className="text-right">
                        <div className="font-semibold text-lg">{count}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          {config.section}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Expand/Collapse Icon */}
                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-6" />
            
            {/* Session Info */}
            {session && (
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Session Date:</span> {session.sessionDate}
                  </div>
                  <div>
                    <span className="font-medium">Handover From:</span> {session.handoverFrom}
                  </div>
                  <div>
                    <span className="font-medium">Handover To:</span> {session.handoverTo}
                  </div>
                </div>
              </div>
            )}

            {/* Sections with Entries */}
            <div className="space-y-6">
              {sectionsData
                .filter(section => section.entries.length > 0)
                .map((section) => (
                  <ApplicationSectionEntries
                    key={section.config.section}
                    section={section}
                    subApplications={appData.subApps}
                    isPrintMode={isPrintMode}
                  />
                ))}
            </div>

            {totalEntries === 0 && (
              <div className="text-center py-8">
                <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No turnover items for this application</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Section Entries Component
interface ApplicationSectionEntriesProps {
  section: SectionData;
  subApplications: any[];
  isPrintMode: boolean;
}

function ApplicationSectionEntries({ section, subApplications, isPrintMode }: ApplicationSectionEntriesProps) {
  const Icon = section.icon;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Icon className={`h-5 w-5 ${getSectionColor(section.config.section)}`} />
        <h4 className="font-semibold text-lg">{section.config.title}</h4>
        <Badge variant="secondary">
          {section.entries.length} {section.entries.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>
      
      <div className="grid gap-3">
        {section.entries.map((entry, index) => (
          <DispatchEntry
            key={entry.id}
            entry={entry}
            index={index + 1}
            subApplications={subApplications}
            isPrintMode={isPrintMode}
          />
        ))}
      </div>
    </div>
  );
}

// Entry Display Component (reused from previous implementation)
interface DispatchEntryProps {
  entry: any;
  index: number;
  subApplications: any[];
  isPrintMode: boolean;
}

function DispatchEntry({ entry, index, subApplications, isPrintMode }: DispatchEntryProps) {
  const isImportant = entry.isImportant || entry.isFlagged;
  
  return (
    <div className={`border rounded-lg p-4 ${isImportant ? 'border-orange-300 bg-orange-50' : 'border-border'} ${isPrintMode ? 'print-entry' : ''}`}>
      <div className="space-y-3">
        {/* Entry Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium mt-0.5">
              {index}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground break-words">
                {entry.title}
              </h4>
              {entry.status && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {entry.status}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            {isImportant && (
              <div className="flex items-center space-x-1 text-orange-600">
                <Flag className="h-4 w-4" />
                <span className="text-xs font-medium">Important</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              {format(new Date(entry.createdAt), 'MMM dd')}
            </div>
          </div>
        </div>

        {/* Description */}
        {entry.description && entry.description !== '<p></p>' && (
          <div className="ml-9">
            <div 
              className="text-sm text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: entry.description }}
            />
          </div>
        )}

        {/* Comments */}
        {entry.comments && entry.comments !== '<p></p>' && (
          <div className="ml-9">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Comments:</span>
              </div>
              <div 
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: entry.comments }}
              />
            </div>
          </div>
        )}

        {/* Sub-applications */}
        {entry.sectionData?.selectedSubApps?.length > 0 && (
          <div className="ml-9">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Affects:</span>
              <div className="flex flex-wrap gap-1">
                {entry.sectionData.selectedSubApps.map((subAppId: string) => {
                  const subApp = subApplications.find(sa => sa.id === subAppId);
                  return subApp ? (
                    <Badge key={subAppId} variant="outline" className="text-xs">
                      {subApp.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get section colors
function getSectionColor(section: string) {
  const colors: Record<string, string> = {
    handover: 'text-blue-600',
    rfc: 'text-purple-600',
    inc: 'text-red-600',
    alerts: 'text-orange-600',
    mim: 'text-indigo-600',
    email_slack: 'text-green-600',
    fyi: 'text-gray-600'
  };
  return colors[section] || 'text-gray-600';
}

// Helper function to get section icons
function getSectionIcon(section: string) {
  const icons: Record<string, any> = {
    handover: ArrowLeftRight,
    rfc: GitPullRequest,
    inc: Bug,
    alerts: AlertTriangle,
    mim: Link,
    email_slack: Mail,
    fyi: Info
  };
  return icons[section] || Info;
}

// Loading Skeleton
function DispatchSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-6 bg-muted rounded w-32"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-48"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                </div>
              </div>
              <div className="flex space-x-6">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="text-center">
                    <div className="h-6 bg-muted rounded w-8 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-12"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
