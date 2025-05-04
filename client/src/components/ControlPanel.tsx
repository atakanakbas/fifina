import React, { useEffect } from "react";
import { BasePairOption } from "@/lib/types";

interface ControlPanelProps {
  basePair: BasePairOption;
  setBasePair: (basePair: BasePairOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  lastUpdated: Date;
  refreshData: () => void;
  overboughtLevel: number;
  setOverboughtLevel: (level: number) => void;
  incrementOverboughtLevel: () => void;
  decrementOverboughtLevel: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  basePair,
  setBasePair,
  searchQuery,
  setSearchQuery,
  lastUpdated,
  refreshData,
  overboughtLevel,
  setOverboughtLevel,
  incrementOverboughtLevel,
  decrementOverboughtLevel,
}) => {
  // Always use USDT as the base pair
  useEffect(() => {
    if (basePair !== "USDT") {
      setBasePair("USDT");
    }
  }, [basePair, setBasePair]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-medium text-gray-700">RSI Period: 14</div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search pairs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <div className="flex flex-row items-center justify-end mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="mr-4">
            <span>Last updated: </span>
            <span className="font-medium">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
