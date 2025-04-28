import { useQuery } from "@tanstack/react-query";
import { Service } from "@shared/schema";
import ServiceHealthGrid from "@/components/health/ServiceHealthGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, PlusCircle } from "lucide-react";
import { useState } from "react";

export default function Health() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: services, isLoading, refetch } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const healthStatus = {
    healthy: services?.filter(s => s.status === "healthy").length || 0,
    warning: services?.filter(s => s.status === "warning").length || 0,
    error: services?.filter(s => s.status === "error").length || 0,
    unknown: services?.filter(s => s.status === "unknown").length || 0,
    total: services?.length || 0
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Services refreshed",
        description: "Service health status has been updated.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh service health data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Health Monitoring</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor the health and performance of your backend services
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Health Summary */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div className="p-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{healthStatus.total}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Services</div>
              </div>
              <div className="p-3">
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">{healthStatus.healthy}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Healthy</div>
              </div>
              <div className="p-3">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{healthStatus.warning}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Warning</div>
              </div>
              <div className="p-3">
                <div className="text-2xl font-bold text-red-600 dark:text-red-500">{healthStatus.error}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>
              </div>
              <div className="p-3">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-500">{healthStatus.unknown}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Unknown</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Tabs */}
      <div className="mb-4">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Services</TabsTrigger>
            <TabsTrigger value="healthy">Healthy</TabsTrigger>
            <TabsTrigger value="warning">Warning</TabsTrigger>
            <TabsTrigger value="error">Error</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="pt-4">
            <ServiceHealthGrid />
          </TabsContent>
          <TabsContent value="healthy" className="pt-4">
            {isLoading ? (
              <div className="animate-pulse">Loading healthy services...</div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {services?.filter(service => service.status === 'healthy').map((service) => (
                  <Card key={service.id} className="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800 dark:border-gray-700">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3 dark:bg-green-700">
                          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">{service.name}</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900 dark:text-white">Healthy</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 dark:bg-gray-900">
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Uptime</span>
                          <span className="text-gray-700 font-medium dark:text-gray-300">
                            {service.uptime}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Response Time</span>
                          <span className="text-gray-700 font-medium dark:text-gray-300">
                            {service.responseTime}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="warning" className="pt-4">
            {isLoading ? (
              <div className="animate-pulse">Loading services with warnings...</div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {services?.filter(service => service.status === 'warning').map((service) => (
                  <Card key={service.id} className="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800 dark:border-gray-700">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3 dark:bg-yellow-700">
                          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">{service.name}</dt>
                            <dd>
                              <div className="text-lg font-medium text-yellow-600 dark:text-yellow-500">Warning</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 dark:bg-gray-900">
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Uptime</span>
                          <span className="text-gray-700 font-medium dark:text-gray-300">
                            {service.uptime}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Response Time</span>
                          <span className="text-yellow-600 font-medium dark:text-yellow-500">
                            {service.responseTime}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="error" className="pt-4">
            {isLoading ? (
              <div className="animate-pulse">Loading services with errors...</div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {services?.filter(service => service.status === 'error').map((service) => (
                  <Card key={service.id} className="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800 dark:border-gray-700">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-red-500 rounded-md p-3 dark:bg-red-700">
                          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">{service.name}</dt>
                            <dd>
                              <div className="text-lg font-medium text-red-600 dark:text-red-500">Error</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 dark:bg-gray-900">
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Uptime</span>
                          <span className="text-red-600 font-medium dark:text-red-500">
                            {service.uptime}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Response Time</span>
                          <span className="text-red-600 font-medium dark:text-red-500">
                            {service.responseTime}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
