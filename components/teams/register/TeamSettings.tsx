'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { updateTeam } from "@/app/actions/teams";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Building2, Users, Mail, User, Settings, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define the validation schema
const teamSettingsSchema = z.object({
  teamName: z.string().min(3, "Team name must be at least 3 characters"),
  userGroup: z.string().min(3, "User group must be at least 3 characters"),
  adminGroup: z.string().min(3, "Admin group must be at least 3 characters"),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type TeamSettingsFormData = z.infer<typeof teamSettingsSchema>;

interface TeamSettingsProps {
  teamDetails: {
    teamName: string;
    userGroup: string;
    adminGroup: string;
    contactName: string | null;
    contactEmail: string | null;
  };
  isAdmin: boolean;
  teamId: string;
}

export default function TeamSettings({ teamDetails, isAdmin, teamId }: TeamSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Initialize form with validation
  const form = useForm<TeamSettingsFormData>({
    resolver: zodResolver(teamSettingsSchema),
    defaultValues: {
      teamName: teamDetails.teamName,
      userGroup: teamDetails.userGroup,
      adminGroup: teamDetails.adminGroup,
      contactName: teamDetails.contactName || "",
      contactEmail: teamDetails.contactEmail || "",
    },
  });

  async function onSubmit(data: TeamSettingsFormData) {
    setIsSubmitting(true);
    try {
      const result = await updateTeam(teamId, {
        teamName: data.teamName,
        userGroup: data.userGroup,
        adminGroup: data.adminGroup,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
      });

      if (result.success) {
        toast.success("Team settings updated successfully");
      } else {
        toast.error(result.error || "Failed to update team settings");
      }
    } catch (error) {
      toast.error("Failed to update team settings");
      console.error("Error updating team settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>Team Settings</CardTitle>
        </div>
        <CardDescription>
          Manage your team's settings and configurations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {isAdmin ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Team Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Team Information</h3>
                  </div>
                  <Separator />
                  <div className="grid gap-6 max-w-xl">
                    <FormField
                      control={form.control}
                      name="teamName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Team Name
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Access Groups Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Access Groups</h3>
                  </div>
                  <Separator />
                  <div className="grid gap-6 max-w-xl">
                    <FormField
                      control={form.control}
                      name="userGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            User Group
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adminGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                            Admin Group
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                  </div>
                  <Separator />
                  <div className="grid gap-6 max-w-xl">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Contact Name
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            Contact Email
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t">
                  <Badge variant="secondary" className="bg-primary/5">
                    <User className="h-3 w-3 mr-1" />
                    Admin Access
                  </Badge>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-8">
              {/* Team Information Section - Read Only */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Team Information</h3>
                </div>
                <Separator />
                <div className="grid gap-4 max-w-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Team Name
                    </div>
                    <p className="text-base">{teamDetails.teamName}</p>
                  </div>
                </div>
              </div>

              {/* Access Groups Section - Read Only */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Access Groups</h3>
                </div>
                <Separator />
                <div className="grid gap-4 max-w-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      User Group
                    </div>
                    <p className="text-base">{teamDetails.userGroup}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <UserCog className="h-4 w-4" />
                      Admin Group
                    </div>
                    <p className="text-base">{teamDetails.adminGroup}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section - Read Only */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                </div>
                <Separator />
                <div className="grid gap-4 max-w-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Contact Name
                    </div>
                    <p className="text-base">{teamDetails.contactName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Contact Email
                    </div>
                    <p className="text-base">{teamDetails.contactEmail || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center pt-6 border-t">
                <Badge variant="secondary" className="bg-primary/5">
                  <User className="h-3 w-3 mr-1" />
                  View Only
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 