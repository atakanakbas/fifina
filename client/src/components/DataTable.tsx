import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { CryptoData, TimeframeOption, SortColumn, SortDirection } from "@/lib/types";

interface DataTableProps {
  cryptoData: CryptoData[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  handleSort: (column: SortColumn) => void;
  toggleFavorite: (id: number) => void;
  timeframe: TimeframeOption;
  overboughtLevel: number;
  isLoading?: boolean;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  cryptoData,
  sortColumn,
  sortDirection,
  handleSort,
  toggleFavorite,
  timeframe,
  overboughtLevel,
  isLoading = false,
  rowsPerPage,
  setRowsPerPage,
}) => {
  const chartInstancesRef = useRef<{ [key: string]: echarts.ECharts }>({});

  // Function to get RSI color class
  const getRsiColorClass = (rsi: number) => {
    if (rsi >= 70) return "text-red-500 font-semibold";
    if (rsi <= 30) return "text-green-500 font-semibold";
    return "text-gray-700";
  };

  // Function to format price based on value
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(8);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(2);
    return price.toFixed(2);
  };

  // Initialize and update charts when component mounts or data changes
  useEffect(() => {
    // Cleanup previous charts
    Object.values(chartInstancesRef.current).forEach(chart => {
      chart.dispose();
    });
    chartInstancesRef.current = {};

    // Create new charts
    cryptoData.forEach((crypto) => {
      const chartId = `sparkline-${crypto.id}`;
      const chartDom = document.getElementById(chartId);
      
      if (chartDom) {
        const chart = echarts.init(chartDom);
        chartInstancesRef.current[chartId] = chart;
        
        // Generate random data for the sparkline
        const data = Array.from({ length: 20 }, () => Math.random() * 10 + 90);
        
        const option = {
          animation: false,
          grid: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
          xAxis: {
            type: "category",
            show: false,
          },
          yAxis: {
            show: false,
            min: "dataMin",
            max: "dataMax",
          },
          series: [
            {
              type: "line",
              data: data,
              showSymbol: false,
              lineStyle: {
                color: crypto.change24h >= 0 ? "#22c55e" : "#ef4444",
                width: 1.5,
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color:
                      crypto.change24h >= 0
                        ? "rgba(34, 197, 94, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                  },
                  {
                    offset: 1,
                    color:
                      crypto.change24h >= 0
                        ? "rgba(34, 197, 94, 0.05)"
                        : "rgba(239, 68, 68, 0.05)",
                  },
                ]),
              },
            },
          ],
        };
        
        chart.setOption(option);
      }
    });

    // Cleanup on component unmount
    return () => {
      Object.values(chartInstancesRef.current).forEach(chart => {
        chart.dispose();
      });
    };
  }, [cryptoData]);

  // Handle window resize to make charts responsive
  useEffect(() => {
    const handleResize = () => {
      Object.values(chartInstancesRef.current).forEach(chart => {
        chart.resize();
      });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-500">Loading cryptocurrency data...</p>
          </div>
        </div>
      )}
      
      {!isLoading && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <i className="fas fa-star text-gray-400"></i>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("pair")}
                >
                  <div className="flex items-center">
                    <span>Pair</span>
                    {sortColumn === "pair" && (
                      <i
                        className={`fas fa-sort-${sortDirection === "asc" ? "up" : "down"} ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center">
                    <span>Price</span>
                    {sortColumn === "price" && (
                      <i
                        className={`fas fa-sort-${sortDirection === "asc" ? "up" : "down"} ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("rsi")}
                >
                  <div className="flex items-center">
                    <span>RSI (14)</span>
                    {sortColumn === "rsi" && (
                      <i
                        className={`fas fa-sort-${sortDirection === "asc" ? "up" : "down"} ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("change24h")}
                >
                  <div className="flex items-center">
                    <span>24h Change</span>
                    {sortColumn === "change24h" && (
                      <i
                        className={`fas fa-sort-${sortDirection === "asc" ? "up" : "down"} ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <span>Chart</span>
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("volume")}
                >
                  <div className="flex items-center">
                    <span>Volume</span>
                    {sortColumn === "volume" && (
                      <i
                        className={`fas fa-sort-${sortDirection === "asc" ? "up" : "down"} ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cryptoData.length > 0 ? (
                cryptoData.map((crypto) => (
                  <tr key={crypto.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleFavorite(crypto.id)}
                        className={`${
                          crypto.isFavorite
                            ? "text-yellow-400 hover:text-yellow-500"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      >
                        <i className={`${crypto.isFavorite ? "fas" : "far"} fa-star`}></i>
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium">
                      <div className="flex flex-col">
                        <span className="text-gray-900">{crypto.pair}</span>
                        {crypto.exchange && (
                          <span className="text-xs font-medium text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded-full">
                            {crypto.exchange}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                      ${formatPrice(crypto.price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`font-mono ${getRsiColorClass(crypto.rsi)}`}>
                        {crypto.rsi.toFixed(1)}
                      </div>
                      {crypto.rsi >= overboughtLevel && (
                        <div className="mt-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm">
                          Overbought
                        </div>
                      )}
                      {crypto.rsi <= 30 && (
                        <div className="mt-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm">
                          Oversold
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`${
                          crypto.change24h >= 0 ? "text-green-500" : "text-red-500"
                        } font-medium`}
                      >
                        {crypto.change24h >= 0 ? "+" : ""}
                        {crypto.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div id={`sparkline-${crypto.id}`} className="w-24 h-12"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      ${crypto.volume}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No cryptocurrencies found</h3>
                      <p className="text-gray-600 max-w-md">
                        Try selecting a different exchange, base pair, or search criteria.
                        Some exchanges may be temporarily unavailable due to API restrictions.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Rows per page selector */}
          <div className="flex justify-end items-center px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-700 mr-4">
              Rows per page:
            </div>
            <div className="flex space-x-2">
              {[50, 100, 300].map((option) => (
                <button
                  key={option}
                  onClick={() => setRowsPerPage(option)}
                  className={`px-3 py-1 text-sm rounded ${
                    rowsPerPage === option
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
