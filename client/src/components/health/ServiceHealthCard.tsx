import { Service } from "@shared/schema";
import { MoreHorizontal, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ServiceHealthCardProps {
  service: Service;
}

export default function ServiceHealthCard({ service }: ServiceHealthCardProps) {
  const getStatusIcon = () => {
    switch (service.status) {
      case "healthy":
        return (
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3 dark:bg-green-700">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
        );
      case "warning":
        return (
          <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3 dark:bg-yellow-700">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
        );
      case "error":
        return (
          <div className="flex-shrink-0 bg-red-500 rounded-md p-3 dark:bg-red-700">
            <XCircle className="h-6 w-6 text-white" />
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 bg-gray-500 rounded-md p-3 dark:bg-gray-700">
            <MoreHorizontal className="h-6 w-6 text-white" />
          </div>
        );
    }
  };

  const getStatusText = () => {
    switch (service.status) {
      case "healthy":
        return (
          <div className="text-lg font-medium text-gray-900 dark:text-white">Healthy</div>
        );
      case "warning":
        return (
          <div className="text-lg font-medium text-yellow-600 dark:text-yellow-500">Warning</div>
        );
      case "error":
        return (
          <div className="text-lg font-medium text-red-600 dark:text-red-500">Error</div>
        );
      default:
        return (
          <div className="text-lg font-medium text-gray-500 dark:text-gray-400">Unknown</div>
        );
    }
  };

  const getResponseTimeClass = () => {
    if (service.responseTime < 100) {
      return "text-gray-700 font-medium dark:text-gray-300";
    } else if (service.responseTime < 300) {
      return "text-yellow-600 font-medium dark:text-yellow-500";
    } else {
      return "text-red-600 font-medium dark:text-red-500";
    }
  };

  const getLastCheckedText = () => {
    if (!service.lastChecked) return "Never";
    
    try {
      return formatDistanceToNow(new Date(service.lastChecked), {
        addSuffix: true,
      });
    } catch (e) {
      return "Unknown";
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                {service.name}
              </dt>
              <dd>{getStatusText()}</dd>
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
            <span className={getResponseTimeClass()}>
              {service.responseTime}ms
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Last Checked</span>
            <span className="text-gray-700 font-medium dark:text-gray-300">
              {getLastCheckedText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
