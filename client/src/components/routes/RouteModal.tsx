import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Route, insertRouteSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define available HTTP methods
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];

// Extended schema with validation
const routeFormSchema = insertRouteSchema.extend({
  path: z
    .string()
    .min(1, "Path is required")
    .regex(/^\//, "Path must start with /"),
  target: z
    .string()
    .min(1, "Target URL is required")
    .url("Target must be a valid URL"),
  timeout: z
    .number()
    .int("Timeout must be an integer")
    .min(100, "Minimum timeout is 100ms")
    .max(60000, "Maximum timeout is 60 seconds (60000ms)"),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
}

export default function RouteModal({ isOpen, onClose, route }: RouteModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  // Create form
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      path: route?.path || "/",
      target: route?.target || "http://",
      methods: route?.methods || ["GET"],
      rateLimit: route?.rateLimit || "100/minute",
      timeout: route?.timeout || 5000,
      authRequired: route?.authRequired || false,
      active: route?.active || true,
    },
  });

  // Update form values when route changes
  useEffect(() => {
    if (route) {
      form.reset({
        path: route.path,
        target: route.target,
        methods: route.methods,
        rateLimit: route.rateLimit,
        timeout: route.timeout,
        authRequired: route.authRequired,
        active: route.active,
      });
      setSelectedMethods(route.methods);
    } else {
      form.reset({
        path: "/",
        target: "http://",
        methods: ["GET"],
        rateLimit: "100/minute",
        timeout: 5000,
        authRequired: false,
        active: true,
      });
      setSelectedMethods(["GET"]);
    }
  }, [route, form]);

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (values: RouteFormValues) => {
      if (route) {
        return await apiRequest("PUT", `/api/routes/${route.id}`, values);
      } else {
        return await apiRequest("POST", "/api/routes", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({
        title: `Route ${route ? "updated" : "created"} successfully`,
        variant: "success",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${route ? "update" : "create"} route`,
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Toggle method selection
  const toggleMethod = (method: string) => {
    setSelectedMethods((prev) => {
      if (prev.includes(method)) {
        return prev.filter((m) => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  // Submit handler
  const onSubmit = (values: RouteFormValues) => {
    // Ensure at least one method is selected
    if (selectedMethods.length === 0) {
      form.setError("methods", {
        type: "manual",
        message: "At least one HTTP method must be selected",
      });
      return;
    }

    // Update methods field with selected methods
    values.methods = selectedMethods;
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{route ? "Edit Route" : "Add New Route"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path</FormLabel>
                    <FormControl>
                      <Input placeholder="/api/resource" {...field} />
                    </FormControl>
                    <FormDescription>
                      The URL path to match (e.g., /api/users)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target URL</FormLabel>
                    <FormControl>
                      <Input placeholder="http://service:8080" {...field} />
                    </FormControl>
                    <FormDescription>
                      The backend service URL to proxy requests to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel htmlFor="methods">HTTP Methods</FormLabel>
                <div className="mt-2 flex flex-wrap gap-4">
                  {HTTP_METHODS.map((method) => (
                    <div className="flex items-center" key={method}>
                      <Checkbox
                        id={`method-${method}`}
                        checked={selectedMethods.includes(method)}
                        onCheckedChange={() => toggleMethod(method)}
                      />
                      <label
                        htmlFor={`method-${method}`}
                        className="ml-2 text-sm font-medium"
                      >
                        {method}
                      </label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.methods && (
                  <p className="text-sm font-medium text-red-500 mt-1">
                    {form.formState.errors.methods.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Select which HTTP methods are allowed for this route
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rateLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Limit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rate limit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="20/minute">20/minute</SelectItem>
                          <SelectItem value="50/minute">50/minute</SelectItem>
                          <SelectItem value="100/minute">100/minute</SelectItem>
                          <SelectItem value="200/minute">200/minute</SelectItem>
                          <SelectItem value="500/minute">500/minute</SelectItem>
                          <SelectItem value="1000/minute">
                            1000/minute
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (ms)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="authRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Authentication Required</FormLabel>
                        <FormDescription>
                          Require authentication for this route
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this route
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : route
                  ? "Save Changes"
                  : "Create Route"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
