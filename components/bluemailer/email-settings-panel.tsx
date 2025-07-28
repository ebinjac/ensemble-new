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
  Mail,
  Plus,
  MoreHorizontal,
  Edit,
  TestTube,
  Star,
  StarOff,
  Trash2,
  Server,
  Shield,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  deleteEmailConfiguration, 
  setDefaultConfiguration,
} from '@/app/actions/bluemailer/email-settings';
import { testEmailConfig } from '@/app/actions/bluemailer/email-sending';
import { toast } from 'sonner';
import Link from 'next/link';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

interface EmailSettingsPanelProps {
  teamId: string;
  emailConfigurations: any[];
}

export function EmailSettingsPanel({ teamId, emailConfigurations }: EmailSettingsPanelProps) {
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

  if (emailConfigurations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Configurations</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You haven't set up any email configurations yet. Add your first SMTP configuration to start sending emails.
            </p>
            <Link href={`/tools/teams/${teamId}/bluemailer/emails/settings/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Email Configuration
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Configurations</span>
            </CardTitle>
            <Link href={`/tools/teams/${teamId}/bluemailer/emails/settings/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailConfigurations.map((config) => (
              <div key={config.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{config.configName}</h3>
                      {config.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4" />
                        <span>{config.smtpHost}:{config.smtpPort}</span>
                        {config.smtpSecure && (
                          <Badge variant="outline" className="text-xs">SSL/TLS</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>
                          {config.smtpAuth ? `Authenticated (${config.smtpUsername})` : 'No Authentication'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>
                          {config.defaultFromName ? `${config.defaultFromName} <${config.defaultFromEmail}>` : config.defaultFromEmail}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Created {formatDistanceToNow(new Date(config.createdAt), { addSuffix: true })} by {config.createdBy}
                    </div>
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Tracking</Label>
                <p className="text-sm text-gray-500">Track email opens automatically</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Send Notifications</Label>
                <p className="text-sm text-gray-500">Notify when emails are sent</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Delivery Reports</Label>
                <p className="text-sm text-gray-500">Generate daily delivery reports</p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

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
