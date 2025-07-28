'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Settings,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  StarOff,
  TestTube,
  Plus,
  Mail,
  Server,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  deleteEmailConfiguration, 
  setDefaultConfiguration 
} from '@/app/actions/bluemailer/email-settings';
import { testEmailConfig } from '@/app/actions/bluemailer/email-sending';
import { toast } from 'sonner';
import Link from 'next/link';


interface EmailConfiguration {
  id: string;
  configName: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpAuth: boolean;
  smtpUsername: string | null;
  defaultFromName: string | null;
  defaultFromEmail: string;
  defaultReplyTo: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  createdBy: string;
}

interface EmailSettingsViewProps {
  configurations: EmailConfiguration[];
  teamId: string;
}

export function EmailSettingsView({ configurations, teamId }: EmailSettingsViewProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!selectedConfigId) return;

    try {
      const result = await deleteEmailConfiguration(teamId, selectedConfigId);
      if (result.success) {
        toast.success('Email configuration deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete configuration');
      }
    } catch (error) {
      toast.error('Failed to delete configuration');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedConfigId(null);
    }
  };

  const handleSetDefault = async (configId: string) => {
    try {
      const result = await setDefaultConfiguration(teamId, configId);
      if (result.success) {
        toast.success('Default configuration updated');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to set default configuration');
      }
    } catch (error) {
      toast.error('Failed to set default configuration');
    }
  };

  const handleTestConfiguration = async (configId: string) => {
    const testEmail = prompt('Enter an email address to send a test email to:');
    if (!testEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setTestingConfigId(configId);
    try {
      const result = await testEmailConfig(teamId, testEmail);
      if (result.success) {
        toast.success(`Test email sent successfully to ${testEmail}`);
      } else {
        toast.error(result.error || 'Failed to send test email');
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setTestingConfigId(null);
    }
  };

  const openDeleteDialog = (configId: string) => {
    setSelectedConfigId(configId);
    setDeleteDialogOpen(true);
  };

  // Show empty state if no configurations
  if (configurations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Configurations</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          You haven't set up any email configurations yet. Add your first SMTP configuration to start sending emails from your templates.
        </p>
        <Link href={`/tools/teams/${teamId}/bluemailer/emails/settings/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Configuration
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configurations.map((config) => (
          <Card key={config.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{config.configName}</CardTitle>
                  {config.isDefault && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => router.push(`/tools/teams/${teamId}/bluemailer/emails/settings/${config.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Configuration
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => handleTestConfiguration(config.id)}
                      disabled={testingConfigId === config.id}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {testingConfigId === config.id ? 'Testing...' : 'Test Configuration'}
                    </DropdownMenuItem>
                    
                    {!config.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(config.id)}>
                        <Star className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => openDeleteDialog(config.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* SMTP Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Server className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">SMTP Server:</span>
                  <span className="text-gray-600">{config.smtpHost}:{config.smtpPort}</span>
                  {config.smtpSecure && (
                    <Badge variant="outline" className="text-xs">SSL/TLS</Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Authentication:</span>
                  <div className="flex items-center space-x-1">
                    {config.smtpAuth ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-gray-600">
                      {config.smtpAuth ? `Yes (${config.smtpUsername})` : 'No'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">From:</span>
                  <span className="text-gray-600">
                    {config.defaultFromName ? `${config.defaultFromName} <${config.defaultFromEmail}>` : config.defaultFromEmail}
                  </span>
                </div>

                {config.defaultReplyTo && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Reply To:</span>
                    <span className="text-gray-600">{config.defaultReplyTo}</span>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="pt-3 border-t text-xs text-gray-500">
                <div>Created by {config.createdBy}</div>
                <div>{formatDistanceToNow(new Date(config.createdAt), { addSuffix: true })}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email configuration? This action cannot be undone.
              Any templates using this configuration will need to be reconfigured.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
