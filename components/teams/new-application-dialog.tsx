'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import {
  createApplication,
  searchCarId,
} from "@/app/actions/applications";
import {
  type ApplicationFormData,
  applicationSchema,
} from "@/app/types/application";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface NewApplicationDialogProps {
  teamId: string;
}

export default function NewApplicationDialog({ teamId }: NewApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationFormData | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      teamId,
      carId: "",
      applicationName: "",
      tla: "",
      description: "",
      tier: 1,
      vpName: "",
      vpEmail: "",
      directorName: "",
      directorEmail: "",
      slackChannel: "",
      snowGroup: "",
    },
  });

  const searchByCarId = async (carId: string) => {
    if (!carId) {
      toast({
        title: "CAR ID is required",
        variant: "destructive",
      });
      return;
    }
    setIsSearching(true);
    setApplicationData(null);
    try {
      const result = await searchCarId(carId);
      
      if (result.success && result.data) {
        const fullData = {
          ...form.getValues(),
          ...result.data,
          carId,
          teamId,
        };
        form.reset(fullData);
        setApplicationData(fullData);
        toast({
          title: "Application Found",
          description: "Review the details below and click 'Create Application'.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch application details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch application details.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      const result = await createApplication({
        ...data,
        teamId,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Application created successfully",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create application",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const carIdValue = form.watch("carId");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        form.reset();
        setApplicationData(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Application</DialogTitle>
          <DialogDescription>
            Add a new application to your team by searching for its CAR ID.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <FormLabel>CAR ID</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="carId"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input {...field} placeholder="Enter CAR ID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => searchByCarId(carIdValue)}
                    disabled={isSearching || !carIdValue}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
            </div>
            
            {isSearching && <p className="text-center text-muted-foreground">Searching...</p>}
            
            {applicationData && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>{applicationData.applicationName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>TLA:</strong> {applicationData.tla}</p>
                    <p><strong>Tier:</strong> {applicationData.tier}</p>
                  </div>
                  <p><strong>Description:</strong> {applicationData.description}</p>
                  
                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">VP Contact</h4>
                      <p>{applicationData.vpName}</p>
                      <p className="text-sm text-muted-foreground">{applicationData.vpEmail}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Director Contact</h4>
                      <p>{applicationData.directorName}</p>
                      <p className="text-sm text-muted-foreground">{applicationData.directorEmail}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Slack Channel</h4>
                      <p>{applicationData.slackChannel || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">ServiceNow Group</h4>
                      <p>{applicationData.snowGroup || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!applicationData}>
                Create Application
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 