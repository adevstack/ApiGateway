import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Tutorial() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">How to Use API Gateway</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Learn how to configure and manage your API Gateway
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Basic concepts to understand how API Gateway works
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              API Gateway provides a centralized entry point for your microservices architecture. It handles 
              routing, rate limiting, authentication, and monitoring - all from a single control panel.
            </p>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Key Features</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>Route management with configurable paths and targets</li>
                <li>Rate limiting with adjustable thresholds</li>
                <li>Authentication and authorization controls</li>
                <li>Request/response logging and monitoring</li>
                <li>Service health monitoring</li>
                <li>Real-time traffic analytics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <AccordionItem value="routes">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <h3 className="text-lg font-medium">Route Configuration</h3>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <p>
                  Routes define how incoming requests are mapped to backend services. You can configure:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li><strong>Path:</strong> The URL path to match (e.g., /api/users)</li>
                  <li><strong>Target:</strong> The backend service URL to forward requests to</li>
                  <li><strong>Methods:</strong> Allowed HTTP methods (GET, POST, PUT, DELETE, etc.)</li>
                  <li><strong>Rate Limit:</strong> Request limits per time period</li>
                  <li><strong>Timeout:</strong> Maximum time to wait for backend response</li>
                  <li><strong>Authentication:</strong> Whether authentication is required</li>
                </ul>
                <p className="mt-2">
                  To add a new route, go to the <strong>Routes</strong> page and click "Add New Route".
                  Fill in the required fields and click "Create Route".
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="health">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <h3 className="text-lg font-medium">Health Monitoring</h3>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <p>
                  The Health page shows the status of all your backend services:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li><strong>Healthy:</strong> Service is responding normally</li>
                  <li><strong>Warning:</strong> Service is responding but with high latency</li>
                  <li><strong>Error:</strong> Service is not responding or returning errors</li>
                </ul>
                <p className="mt-2">
                  You can click "Refresh" to get the latest status or filter services by status using the tabs.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="analytics">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <h3 className="text-lg font-medium">Traffic Analytics</h3>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <p>
                  The Analytics page provides insights into your API traffic:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li><strong>Traffic Over Time:</strong> Request and error counts over time</li>
                  <li><strong>Request Path Distribution:</strong> Which endpoints are most used</li>
                  <li><strong>Error Types:</strong> Breakdown of error categories</li>
                  <li><strong>Latency Distribution:</strong> Response time analysis</li>
                </ul>
                <p className="mt-2">
                  Use the time range selector (hourly, daily, weekly) to adjust the view.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="settings">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <h3 className="text-lg font-medium">Global Settings</h3>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <p>
                  The Settings page allows you to configure global settings:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li><strong>API Port:</strong> Port number for the gateway server</li>
                  <li><strong>Log Level:</strong> Logging detail level</li>
                  <li><strong>Default Timeout:</strong> Default request timeout</li>
                  <li><strong>Request Logging:</strong> Enable/disable detailed request logs</li>
                  <li><strong>Rate Limiting:</strong> Enable/disable global rate limiting</li>
                  <li><strong>Max Concurrent Requests:</strong> Limit simultaneous connections</li>
                </ul>
                <p className="mt-2">
                  After making changes, click "Save Settings" to apply them.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Usage</CardTitle>
            <CardDescription>
              Tips for getting the most out of your API Gateway
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Load Balancing</h3>
              <p>
                For high-traffic services, you can set up multiple backend instances and let the API Gateway 
                handle load balancing. Create multiple routes with the same path but different targets, 
                and the gateway will distribute requests using a round-robin algorithm.
              </p>

              <h3 className="text-lg font-medium">Authentication</h3>
              <p>
                When enabling authentication for a route, clients must include an 
                authorization header with their requests. You can configure authentication 
                credentials in the route settings.
              </p>

              <h3 className="text-lg font-medium">Monitoring Best Practices</h3>
              <p>
                Regularly check the Analytics and Health pages to identify:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>Unexpected traffic spikes</li>
                <li>Services with degrading performance</li>
                <li>Error rate increases</li>
                <li>Routes approaching rate limits</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>
              Need help with your API Gateway?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              If you have questions or encounter issues, please contact our support team at:
            </p>
            <p className="font-medium">avr14068@gmail.com</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}