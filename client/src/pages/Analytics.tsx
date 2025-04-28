import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrafficData } from "@shared/schema";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowDownUp, Database, CloudOff, Clock } from "lucide-react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<"hourly" | "daily" | "weekly">("hourly");
  
  const { data: trafficData, isLoading } = useQuery<TrafficData[]>({
    queryKey: ["/api/traffic"],
  });

  // Generate path distribution data (based on routes data)
  const pathData = [
    { name: "/api/users", value: 43 },
    { name: "/api/products", value: 28 },
    { name: "/api/orders", value: 15 },
    { name: "/api/payments", value: 8 },
    { name: "Other", value: 6 },
  ];

  // Generate error types data
  const errorData = [
    { name: "Rate Limit Exceeded", count: 156 },
    { name: "Service Unavailable", count: 108 },
    { name: "Timeout", count: 89 },
    { name: "Bad Gateway", count: 62 },
    { name: "Authentication Failed", count: 45 },
  ];

  // Generate latency distribution data
  const latencyData = [
    { range: "0-50ms", count: 1245 },
    { range: "51-100ms", count: 986 },
    { range: "101-200ms", count: 743 },
    { range: "201-500ms", count: 532 },
    { range: "501-1000ms", count: 321 },
    { range: ">1000ms", count: 203 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    switch (timeRange) {
      case "hourly":
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case "daily":
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case "weekly":
        return date.toLocaleDateString([], { weekday: 'short' });
      default:
        return date.toLocaleTimeString();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Detailed traffic analysis and insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="w-full h-80">
              <CardHeader>
                <div className="h-6 w-48 bg-gray-200 rounded dark:bg-gray-700"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full bg-gray-200 rounded dark:bg-gray-700"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Detailed traffic analysis and insights
        </p>
      </div>

      <div className="mb-6">
        <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as "hourly" | "daily" | "weekly")}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="hourly">Hourly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Over Time */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">
              <ArrowDownUp className="h-4 w-4 inline mr-2 text-blue-500" />
              Traffic Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {trafficData && trafficData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trafficData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [value, ""]}
                      labelFormatter={(label) => formatTime(label as string)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      name="Requests"
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="errors"
                      name="Errors"
                      stroke="#ef4444"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">No traffic data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Path Distribution */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">
              <Database className="h-4 w-4 inline mr-2 text-indigo-500" />
              Request Path Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pathData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pathData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Error Types */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">
              <CloudOff className="h-4 w-4 inline mr-2 text-red-500" />
              Error Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={errorData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Latency Distribution */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">
              <Clock className="h-4 w-4 inline mr-2 text-yellow-500" />
              Latency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={latencyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
