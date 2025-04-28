import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  isIncrease?: boolean;
  iconBgColor?: string;
  iconColor?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  isIncrease = true,
  iconBgColor = "bg-blue-50",
  iconColor = "text-blue-500",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-800">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white transition-all duration-300 ease-in-out">
            {value}
          </p>
        </div>
        <div className={cn("p-3 rounded-full transition-colors duration-200", iconBgColor)}>
          <div className={cn("transition-all duration-200", iconColor)}>{icon}</div>
        </div>
      </div>
      {change && (
        <div className="mt-2 flex items-center">
          <span
            className={cn(
              "text-sm font-medium transition-all duration-300 ease-in-out",
              isIncrease ? "text-green-500" : "text-red-500"
            )}
          >
            {isIncrease ? "+" : "-"}
            {change}
          </span>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 transition-opacity duration-300">
            from last week
          </span>
        </div>
      )}
    </div>
  );
}
