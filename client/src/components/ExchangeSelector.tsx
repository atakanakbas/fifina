import React, { useEffect } from "react";
import { ExchangeOption } from "@/lib/types";

interface ExchangeSelectorProps {
  selectedExchange: ExchangeOption;
  setSelectedExchange: (exchange: ExchangeOption) => void;
}

const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({
  selectedExchange,
  setSelectedExchange,
}) => {
  // Force set to "All" since we're removing the exchange selection
  useEffect(() => {
    if (selectedExchange !== "All") {
      setSelectedExchange("All");
    }
  }, [selectedExchange, setSelectedExchange]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
        <div className="flex items-center">
          <div className="font-medium text-gray-700 mb-2 sm:mb-0 sm:mr-4">Cryptocurrencies</div>
          <div className="px-4 py-2 text-sm rounded-lg whitespace-nowrap flex items-center bg-blue-600 text-white">
            <i className="fas fa-coins text-yellow-300 mr-2"></i>
            All Available Coins
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <i className="fas fa-info-circle mr-1"></i> 
        Showing data from all available exchanges. Combined view shows the most comprehensive list of cryptocurrencies.
      </div>
    </div>
  );
};

export default ExchangeSelector;