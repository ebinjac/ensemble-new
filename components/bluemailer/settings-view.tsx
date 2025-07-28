'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail,
  Users,
  Shield,
  Bell,
  Globe,
  Palette,
  Database,
  Key,
  Settings,
  Plus,
  Edit,
  Trash2,
  TestTube,
  Save,
  AlertTriangle
} from 'lucide-react';
import { EmailSettingsPanel } from '@/components/bluemailer/email-settings-panel';
import { toast } from 'sonner';

interface SettingsViewProps {
  teamId: string;
  user: any;
  team: any;
  emailConfigurations: any[];
  teamSettings: any;
}

const settingsCategories = [
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    description: 'Basic team information and preferences'
  },
  {
    id: 'email',
    label: 'Email Settings',
    icon: Mail,
    description: 'SMTP configuration and email preferences'
  },
  {
    id: 'members',
    label: 'Team Members',
    icon: Users,
    description: 'Manage team members and permissions'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Email and system notification preferences'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Access control and security settings'
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme and display preferences'
  }
];

export function SettingsView({
  teamId,
  user,
  team,
  emailConfigurations,
  teamSettings
}: SettingsViewProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    teamName: team?.name || '',
    teamDescription: team?.description || '',
    timezone: teamSettings?.timezone || 'UTC',
    dateFormat: teamSettings?.dateFormat || 'MM/dd/yyyy',
    language: teamSettings?.language || 'en',
  });

  // Appearance settings state
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: teamSettings?.theme || 'light',
    accentColor: teamSettings?.accentColor || 'blue',
    compactMode: teamSettings?.compactMode || false,
    showAnimations: teamSettings?.showAnimations !== false,
  });

  const handleSaveGeneral = async () => {
    setIsLoading(true);
    try {
      // Save general settings
      const response = await fetch(`/api/teams/${teamId}/settings/general`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalSettings),
      });

      if (response.ok) {
        toast.success('General settings saved successfully');
        router.refresh();
      } else {
        toast.error('Failed to save general settings');
      }
    } catch (error) {
      toast.error('Failed to save general settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    setIsLoading(true);
    try {
      // Save appearance settings
      const response = await fetch(`/api/teams/${teamId}/settings/appearance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appearanceSettings),
      });

      if (response.ok) {
        toast.success('Appearance settings saved successfully');
        router.refresh();
      } else {
        toast.error('Failed to save appearance settings');
      }
    } catch (error) {
      toast.error('Failed to save appearance settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Settings Navigation */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {settingsCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeCategory === category.id 
                      ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' 
                      : 'text-gray-700'
                  }`}
                >
                  <category.icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{category.label}</div>
                    <div className="text-xs text-gray-500">{category.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Settings Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* General Settings */}
        {activeCategory === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      value={generalSettings.teamName}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        teamName: e.target.value
                      }))}
                      placeholder="Enter team name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={generalSettings.timezone} 
                      onValueChange={(value) => setGeneralSettings(prev => ({
                        ...prev,
                        timezone: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={generalSettings.language} 
                      onValueChange={(value) => setGeneralSettings(prev => ({
                        ...prev,
                        language: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="teamDescription">Team Description</Label>
                    <Textarea
                      id="teamDescription"
                      value={generalSettings.teamDescription}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        teamDescription: e.target.value
                      }))}
                      placeholder="Describe your team's purpose"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select 
                      value={generalSettings.dateFormat} 
                      onValueChange={(value) => setGeneralSettings(prev => ({
                        ...prev,
                        dateFormat: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MMM dd, yyyy">MMM DD, YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSaveGeneral} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Settings */}
        {activeCategory === 'email' && (
          <EmailSettingsPanel 
            teamId={teamId}
            emailConfigurations={emailConfigurations}
          />
        )}
        
        {/* Appearance */}
        {activeCategory === 'appearance' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={appearanceSettings.theme} 
                      onValueChange={(value) => setAppearanceSettings(prev => ({
                        ...prev,
                        theme: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <Select 
                      value={appearanceSettings.accentColor} 
                      onValueChange={(value) => setAppearanceSettings(prev => ({
                        ...prev,
                        accentColor: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compactMode">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Use smaller spacing and elements
                      </p>
                    </div>
                    <Switch
                      id="compactMode"
                      checked={appearanceSettings.compactMode}
                      onCheckedChange={(checked) => setAppearanceSettings(prev => ({
                        ...prev,
                        compactMode: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showAnimations">Animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable interface animations
                      </p>
                    </div>
                    <Switch
                      id="showAnimations"
                      checked={appearanceSettings.showAnimations}
                      onCheckedChange={(checked) => setAppearanceSettings(prev => ({
                        ...prev,
                        showAnimations: checked
                      }))}
                    />
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSaveAppearance} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
