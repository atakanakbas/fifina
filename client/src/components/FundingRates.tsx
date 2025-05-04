import React, { useState, useEffect } from "react";
import { FundingRate } from "@/lib/types";

interface FundingRatesProps {
  exchange: string;
}

const FundingRates: React.FC<FundingRatesProps> = ({ exchange }) => {
  const [fundingRates, setFundingRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch funding rates (mock implementation for now)
  useEffect(() => {
    setLoading(true);
    
    // In a real implementation, fetch from an API
    setTimeout(() => {
      const topCoins = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"];
      const mockRates: FundingRate[] = topCoins.map(symbol => ({
        symbol,
        rate: (Math.random() * 0.2 - 0.1), // Between -0.1% and 0.1%
        timestamp: Date.now(),
      }));
      
      setFundingRates(mockRates);
      setLoading(false);
    }, 1000);
  }, [exchange]);

  // Get CSS class based on funding rate
  const getRateColorClass = (rate: number): string => {
    if (rate > 0.01) return "text-red-500";
    if (rate < -0.01) return "text-green-500";
    return "text-gray-700";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">Funding Rates ({exchange})</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fundingRates.map((item) => (
                  <tr key={item.symbol} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.symbol}/USDT
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium text-right ${getRateColorClass(item.rate)}`}>
                      {(item.rate * 100).toFixed(4)}%
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                      {item.rate > 0 ? (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                          Pay Long
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                          Pay Short
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="text-xs text-gray-500 mt-3">
            <div className="flex items-center">
              <i className="fas fa-info-circle mr-1"></i>
              Funding occurs every 8 hours. Positive rates are paid by longs to shorts, 
              negative rates are paid by shorts to longs.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FundingRates;