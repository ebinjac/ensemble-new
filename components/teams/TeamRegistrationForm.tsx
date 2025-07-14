'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { registerTeam, checkTeamNameAvailability, getTeamRegistrationStatus } from "@/app/actions/teams";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import type { SSOUser } from "@/app/types/auth";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Form validation schema
const teamFormSchema = z.object({
  teamName: z.string().min(3, {
    message: "Team name must be at least 3 characters.",
  }),
  userGroup: z.string().min(3, {
    message: "User group must be at least 3 characters.",
  }),
  adminGroup: z.string().min(3, {
    message: "Admin group must be at least 3 characters.",
  }),
  contactName: z.string().min(2, {
    message: "Contact name must be at least 2 characters.",
  }),
  contactEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

interface TeamRegistrationFormProps {
  user: SSOUser;
}

export function TeamRegistrationForm({ user }: TeamRegistrationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      teamName: "",
      userGroup: "",
      adminGroup: "",
      contactName: user?.fullName || "",
      contactEmail: user?.email || "",
    },
  });

  const teamName = form.watch("teamName");
  const debouncedTeamName = useDebounce(teamName, 500);

  // Check team name availability
  useEffect(() => {
    async function checkName() {
      if (debouncedTeamName.length >= 3) {
        setIsCheckingName(true);
        try {
          const isAvailable = await checkTeamNameAvailability(debouncedTeamName);
          setIsNameAvailable(isAvailable);
        } catch (error) {
          console.error("Failed to check team name:", error);
        } finally {
          setIsCheckingName(false);
        }
      } else {
        setIsNameAvailable(null);
      }
    }
    checkName();
  }, [debouncedTeamName]);

  // Check registration status
  useEffect(() => {
    async function checkStatus() {
      if (teamName) {
        const status = await getTeamRegistrationStatus(teamName);
        setRegistrationStatus(status);
      }
    }
    checkStatus();
  }, [teamName]);

  async function onSubmit(values: TeamFormValues) {
    if (!isNameAvailable) {
      toast.error("Team name is not available");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await registerTeam(values);
      
      if (result.success && result.requestId) {
        // Redirect to the confirmation page
        router.push(`/teams/register/confirmation/${result.requestId}`);
      }
    } catch (error) {
      console.error("Failed to register team:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit registration request");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getNameAvailabilityIcon() {
    if (isCheckingName) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isNameAvailable === true) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (isNameAvailable === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return null;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Register a New Team</CardTitle>
        <CardDescription>
          Create a new team and set up access groups for users and administrators.
          Your request will be reviewed by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Enter team name" 
                        {...field} 
                        className={
                          isNameAvailable === false ? "border-red-500" : 
                          isNameAvailable === true ? "border-green-500" : ""
                        }
                      />
                      {getNameAvailabilityIcon()}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {isCheckingName ? "Checking availability..." :
                     isNameAvailable === false ? "This team name is already taken" :
                     isNameAvailable === true ? "Team name is available" :
                     "This will be your team's display name."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Group</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SSO_TEAM_USERS" {...field} />
                  </FormControl>
                  <FormDescription>
                    AD group for regular team members.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Group</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SSO_TEAM_ADMINS" {...field} />
                  </FormControl>
                  <FormDescription>
                    AD group for team administrators.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Primary contact person for this team.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact email" {...field} />
                  </FormControl>
                  <FormDescription>
                    Email address for team-related communications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !isNameAvailable}
            >
              {isSubmitting ? "Submitting Request..." : "Submit Registration Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
      {registrationStatus && (
        <CardFooter>
          <Alert className="w-full">
            <AlertTitle>Registration Status</AlertTitle>
            <AlertDescription>
              {registrationStatus === 'pending' && "Your team registration request is pending approval."}
              {registrationStatus === 'approved' && "Your team registration request has been approved!"}
              {registrationStatus === 'rejected' && "Your team registration request was rejected. Please contact support for more information."}
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
} 