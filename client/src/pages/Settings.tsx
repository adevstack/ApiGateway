import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  apiPort: z.number().min(1024).max(65535),
  logLevel: z.string(),
  defaultTimeout: z.number().min(100).max(60000),
  enableLogging: z.boolean(),
  enableRateLimiting: z.boolean(),
  concurrentRequests: z.number().min(10).max(1000),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      apiPort: 8000,
      logLevel: "info",
      defaultTimeout: 5000,
      enableLogging: true,
      enableRateLimiting: true,
      concurrentRequests: 100,
    },
  });

  const onSubmit = async (values: SettingsValues) => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    toast({
      title: "Settings saved",
      description: "Your configuration has been updated successfully.",
      variant: "success",
    });
    console.log(values);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure global settings for the API Gateway
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure the basic settings for API Gateway
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="apiPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Port</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        The port that the API Gateway should listen on
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Log Level</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="debug">Debug</option>
                          <option value="info">Info</option>
                          <option value="warn">Warning</option>
                          <option value="error">Error</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Set the logging level for server logs
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultTimeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Timeout (ms): {field.value}ms</FormLabel>
                      <FormControl>
                        <Slider
                          min={100}
                          max={60000}
                          step={100}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Default timeout for requests in milliseconds
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <CardFooter className="px-0 pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Configure advanced settings for the API Gateway
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="enableLogging"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Request Logging</FormLabel>
                        <FormDescription>
                          Log all incoming requests
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableRateLimiting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Rate Limiting</FormLabel>
                        <FormDescription>
                          Enable global rate limiting
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="concurrentRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Concurrent Requests: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={10}
                          max={1000}
                          step={10}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of concurrent requests
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Button 
                  variant="outline" 
                  onClick={() => {
                    toast({
                      title: "Purged cache",
                      description: "All cached responses have been cleared.",
                      variant: "success",
                    });
                  }}
                  className="w-full mt-4"
                >
                  Purge Response Cache
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
