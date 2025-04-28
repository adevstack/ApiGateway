import { useQuery } from "@tanstack/react-query";
import { Service } from "@shared/schema";
import ServiceHealthCard from "./ServiceHealthCard";

export default function ServiceHealthGrid() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg border animate-pulse dark:bg-gray-800 dark:border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-300 rounded-md p-3 dark:bg-gray-700">
                  <div className="h-6 w-6"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 w-24 bg-gray-300 rounded dark:bg-gray-700 mb-2"></div>
                  <div className="h-6 w-16 bg-gray-300 rounded dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6 dark:bg-gray-900">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-300 rounded dark:bg-gray-700"></div>
                  <div className="h-4 w-12 bg-gray-300 rounded dark:bg-gray-700"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-300 rounded dark:bg-gray-700"></div>
                  <div className="h-4 w-12 bg-gray-300 rounded dark:bg-gray-700"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-300 rounded dark:bg-gray-700"></div>
                  <div className="h-4 w-16 bg-gray-300 rounded dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">No services found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceHealthCard key={service.id} service={service} />
      ))}
    </div>
  );
}
