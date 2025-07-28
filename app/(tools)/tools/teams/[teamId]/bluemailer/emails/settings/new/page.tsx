'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import { createEmailConfiguration } from '@/app/actions/bluemailer/email-settings';
import { testEmailConfig } from '@/app/actions/bluemailer/email-sending';
import { toast } from 'sonner';
import Link from 'next/link';

interface NewEmailConfigPageProps {
  params: {
    teamId: string;
  };
}

export default function NewEmailConfigPage({ params }: NewEmailConfigPageProps) {
  const { teamId } = params;
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    configName: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpAuth: true,
    smtpUsername: '',
    smtpPassword: '',
    defaultFromName: '',
    defaultFromEmail: '',
    defaultReplyTo: '',
    isDefault: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.configName.trim()) {
      toast.error('Configuration name is required');
      return;
    }
    
    if (!formData.smtpHost.trim()) {
      toast.error('SMTP host is required');
      return;
    }
    
    if (!formData.defaultFromEmail.trim()) {
      toast.error('Default from email is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createEmailConfiguration(teamId, formData);
      
      if (result.success) {
        toast.success('Email configuration created successfully');
        router.push(`/tools/teams/${teamId}/bluemailer/emails/settings`);
      } else {
        toast.error(result.error || 'Failed to create configuration');
      }
    } catch (error) {
      toast.error('Failed to create configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!formData.smtpHost.trim() || !formData.defaultFromEmail.trim()) {
      toast.error('Please fill in SMTP host and from email before testing');
      return;
    }

    const testEmail = prompt('Enter an email address to send a test email to:');
    if (!testEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsTesting(true);
    try {
      // First create a temporary configuration to test
      const tempResult = await createEmailConfiguration(teamId, {
        ...formData,
        configName: `Test - ${formData.configName || 'Temporary'}`,
        isDefault: false,
      });

      if (tempResult.success && tempResult.configId) {
        const testResult = await testEmailConfig(teamId, testEmail);
        
        // Clean up the temporary configuration
        // You might want to add a cleanup function here
        
        if (testResult.success) {
          toast.success(`Test email sent successfully to ${testEmail}`);
        } else {
          toast.error(testResult.error || 'Test email failed');
        }
      }
    } catch (error) {
      toast.error('Failed to test configuration');
    } finally {
      setIsTesting(false);
    }
  };

  // Preset configurations
  const presets = [
    {
      name: 'Free SMTP Server',
      smtpHost: 'smtp.freesmtpservers.com',
      smtpPort: 25,
      smtpSecure: false,
      smtpAuth: false,
    },
    {
      name: 'Gmail',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpAuth: true,
    },
    {
      name: 'Outlook',
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpAuth: true,
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setFormData(prev => ({
      ...prev,
      smtpHost: preset.smtpHost,
      smtpPort: preset.smtpPort,
      smtpSecure: preset.smtpSecure,
      smtpAuth: preset.smtpAuth,
      configName: prev.configName || preset.name,
    }));
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link href={`/tools/teams/${teamId}/bluemailer/emails/settings`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Email Configuration</h1>
          <p className="text-muted-foreground">
            Configure SMTP settings to send emails from your templates
          </p>
        </div>
      </div>

      {/* Presets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                onClick={() => applyPreset(preset)}
                className="text-left justify-start"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <Label htmlFor="configName">Configuration Name *</Label>
              <Input
                id="configName"
                value={formData.configName}
                onChange={(e) => handleInputChange('configName', e.target.value)}
                placeholder="e.g., Production SMTP"
                required
              />
            </div>

            {/* SMTP Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SMTP Server Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host *</Label>
                  <Input
                    id="smtpHost"
                    value={formData.smtpHost}
                    onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                    placeholder="smtp.example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">Port *</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value))}
                    placeholder="587"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtpSecure"
                    checked={formData.smtpSecure}
                    onCheckedChange={(checked) => handleInputChange('smtpSecure', checked)}
                  />
                  <Label htmlFor="smtpSecure">Use SSL/TLS (port 465)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtpAuth"
                    checked={formData.smtpAuth}
                    onCheckedChange={(checked) => handleInputChange('smtpAuth', checked)}
                  />
                  <Label htmlFor="smtpAuth">Requires Authentication</Label>
                </div>
              </div>

              {formData.smtpAuth && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpUsername">Username</Label>
                    <Input
                      id="smtpUsername"
                      value={formData.smtpUsername}
                      onChange={(e) => handleInputChange('smtpUsername', e.target.value)}
                      placeholder="your-username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={formData.smtpPassword}
                      onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                      placeholder="your-password"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Default Email Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Default Email Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultFromName">From Name</Label>
                  <Input
                    id="defaultFromName"
                    value={formData.defaultFromName}
                    onChange={(e) => handleInputChange('defaultFromName', e.target.value)}
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultFromEmail">From Email *</Label>
                  <Input
                    id="defaultFromEmail"
                    type="email"
                    value={formData.defaultFromEmail}
                    onChange={(e) => handleInputChange('defaultFromEmail', e.target.value)}
                    placeholder="noreply@yourcompany.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="defaultReplyTo">Reply To Email</Label>
                <Input
                  id="defaultReplyTo"
                  type="email"
                  value={formData.defaultReplyTo}
                  onChange={(e) => handleInputChange('defaultReplyTo', e.target.value)}
                  placeholder="support@yourcompany.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
                />
                <Label htmlFor="isDefault">Set as default configuration</Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing...' : 'Test Configuration'}
              </Button>
              
              <div className="flex space-x-2">
                <Link href={`/tools/teams/${teamId}/bluemailer/emails/settings`}>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating...' : 'Create Configuration'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
