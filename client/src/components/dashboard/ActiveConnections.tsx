import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { DashboardStats } from "@shared/schema";

interface ActiveConnectionsProps {
  className?: string;
}

export default function ActiveConnections({ className }: ActiveConnectionsProps) {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds to reduce server load
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Sample data for the pie chart
  const data = [
    { name: "User Service", value: 40 },
    { name: "Product Service", value: 38 },
    { name: "Order Service", value: 56 },
    { name: "Payment Service", value: 22 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow dark:bg-gray-800 ${className}`}>
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Active Connections</h3>
        </div>
        <div className="px-6 py-5">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-24 bg-gray-200 rounded-md dark:bg-gray-700 mb-4"></div>
            <div className="h-48 w-48 bg-gray-200 rounded-full dark:bg-gray-700 mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700 mb-2"></div>
            <div className="h-4 w-40 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow dark:bg-gray-800 ${className}`}>
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Active Connections</h3>
      </div>
      <div className="px-6 py-5">
        <div className="text-4xl font-bold text-center mb-4 dark:text-white">
          {stats?.activeConnections || 0}
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} connections`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-gray-400">Load Balancing</span>
            <span className="font-medium dark:text-white">Round Robin</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Rate Limit Status</span>
            <span className="font-medium text-green-500">Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
