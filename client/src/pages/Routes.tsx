import RoutesTable from "@/components/routes/RoutesTable";
import ScrollAnchorSection from "@/components/ScrollAnchorSection";
import { useScrollLock } from "@/hooks/use-scroll-lock";

export default function Routes() {
  // Use the scroll lock hook to prevent scroll position resets during data refresh
  useScrollLock();
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Routes Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure and manage API Gateway routes
        </p>
      </div>
      
      <ScrollAnchorSection 
        id="routes-table" 
        title="API Gateway Routes"
        maxHeight="600px"
      >
        <div className="p-4">
          <RoutesTable />
        </div>
      </ScrollAnchorSection>
    </div>
  );
}
