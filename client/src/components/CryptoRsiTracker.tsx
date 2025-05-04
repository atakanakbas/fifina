import React, { useState, useEffect } from "react";
import Header from "./Header";
import ExchangeSelector from "./ExchangeSelector";
import ControlPanel from "./ControlPanel";
import DataTable from "./DataTable";
import MarketSentiment from "./MarketSentiment";
import FundingRates from "./FundingRates";
import { 
  CryptoData,
  BasePairOption, 
  SortColumn, 
  SortDirection,
  ExchangeOption,
  TimeframeOption
} from "@/lib/types";
import { fetchCryptoData } from "@/lib/api";

// Use a fixed timeframe of "1d" with RSI period of 14
const FIXED_TIMEFRAME: TimeframeOption = "1d";

const CryptoRsiTracker: React.FC = () => {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeOption>("All");
  const [basePair, setBasePair] = useState<BasePairOption>("USDT");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("rsi");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [overboughtLevel, setOverboughtLevel] = useState(70);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState<number>(100); // Default to show 100 rows
  const [currentPage, setCurrentPage] = useState<number>(1); // Current page for pagination
  const [totalPages, setTotalPages] = useState<number>(1); // Total number of pages

  // Load data from exchange API
  const loadExchangeData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let fetchedData: CryptoData[] = [];
      
      // Use the optimized fetchCryptoData function which handles region restrictions
      if (selectedExchange === "All") {
        // For "All" exchanges, fetch data from all available exchanges
        fetchedData = await fetchCryptoData(selectedExchange, basePair, FIXED_TIMEFRAME);
        
        // Display appropriate messages based on available exchanges
        if (fetchedData.length === 0) {
          setError("Unable to fetch data from any exchange. Please try again later.");
        } else {
          // Get unique exchange names from the data to determine which exchanges worked
          const exchanges = new Set(fetchedData.map(item => item.exchange));
          const workingExchanges = Array.from(exchanges);
          
          // Check if all expected exchanges are present
          const allExchanges = ["Binance", "Gate", "Kucoin", "Bybit"];
          const missingExchanges = allExchanges.filter(e => !exchanges.has(e));
          
          if (missingExchanges.length > 0) {
            const availableMsg = workingExchanges.length > 0 
              ? `Showing data from ${workingExchanges.join(", ")}.` 
              : "";
            
            setError(`${availableMsg} Some exchanges may be unavailable due to API restrictions in your region.`);
          }
        }
      } else {
        // For a specific exchange, fetch data directly from that exchange
        fetchedData = await fetchCryptoData(
          selectedExchange,
          basePair,
          FIXED_TIMEFRAME
        );
        
        if (fetchedData.length === 0) {
          // If the data came back empty, provide appropriate error message based on which exchange
          if (selectedExchange === "Binance" || selectedExchange === "Bybit") {
            setError(`Data from ${selectedExchange} is not available in your region due to API restrictions. Try another exchange.`);
          } else {
            setError(`No cryptocurrencies found for ${selectedExchange} with the selected base pair (${basePair}). Try different criteria.`);
          }
        } else {
          // Clear any previous error if we successfully got data
          setError(null);
        }
      }
      
      // Only update if we received data
      if (fetchedData.length > 0) {
        // Preserve favorite status for existing pairs
        const updatedData = fetchedData.map((newCrypto: CryptoData) => {
          const existingCrypto = cryptoData.find(
            crypto => crypto.pair === newCrypto.pair && crypto.exchange === newCrypto.exchange
          );
          return {
            ...newCrypto,
            isFavorite: existingCrypto ? existingCrypto.isFavorite : false
          };
        });
        
        setCryptoData(updatedData);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data from the exchange. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };



  // Check if an exchange is available or not
  const isExchangeAvailable = (exchange: ExchangeOption): boolean => {
    // All exchanges are now available through our proxy solution
    return true;
  };
  
  // No longer automatically redirecting to different exchanges
  // Allow users to select any exchange, even if there might be regional restrictions
  
  // Load data when exchange or base pair changes
  useEffect(() => {
    loadExchangeData();
    // No auto-refresh - data will be refreshed only when user clicks the "Refresh Data" button
  }, [selectedExchange, basePair]);
  
  // Initial data load on component mount
  useEffect(() => {
    if (selectedExchange === "All" && cryptoData.length === 0) {
      loadExchangeData();
    }
  }, []);

  // Function to toggle favorite status
  const toggleFavorite = (id: number) => {
    setCryptoData((prevData) =>
      prevData.map((crypto) =>
        crypto.id === id
          ? { ...crypto, isFavorite: !crypto.isFavorite }
          : crypto
      )
    );
  };

  // Function to handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Function to get sorted and filtered data
  const getSortedAndFilteredData = () => {
    let filteredData = cryptoData;
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      filteredData = filteredData.filter(
        (crypto) =>
          crypto.pair.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort data
    return filteredData.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case "pair":
          comparison = a.pair.localeCompare(b.pair);
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "rsi":
          comparison = a.rsi - b.rsi;
          break;
        case "change24h":
          comparison = a.change24h - b.change24h;
          break;
        case "volume":
          // Handle volume safely
          const aVol = parseFloat(a.volume.replace(/[^0-9.]/g, "") || "0");
          const bVol = parseFloat(b.volume.replace(/[^0-9.]/g, "") || "0");
          comparison = aVol - bVol;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Function to refresh data manually
  const refreshData = () => {
    loadExchangeData();
  };

  // Handle overbought level changes
  const incrementOverboughtLevel = () => {
    if (overboughtLevel < 90) {
      setOverboughtLevel(overboughtLevel + 1);
    }
  };

  const decrementOverboughtLevel = () => {
    if (overboughtLevel > 50) {
      setOverboughtLevel(overboughtLevel - 1);
    }
  };

  // Calculate total pages for pagination
  useEffect(() => {
    const filteredData = getSortedAndFilteredData();
    setTotalPages(Math.ceil(filteredData.length / rowsPerPage));
  }, [cryptoData, rowsPerPage, searchQuery, sortColumn, sortDirection]);

  // Get paginated data
  const getPaginatedData = () => {
    const filteredAndSortedData = getSortedAndFilteredData();
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedData.slice(startIndex, endIndex);
  };

  // Change page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <ExchangeSelector
          selectedExchange={selectedExchange}
          setSelectedExchange={setSelectedExchange}
        />
        
        <ControlPanel
          basePair={basePair}
          setBasePair={setBasePair}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          lastUpdated={lastUpdated}
          refreshData={refreshData}
          overboughtLevel={overboughtLevel}
          setOverboughtLevel={setOverboughtLevel}
          incrementOverboughtLevel={incrementOverboughtLevel}
          decrementOverboughtLevel={decrementOverboughtLevel}
        />
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {selectedExchange === "All" && (
          <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded mb-6">
            <div className="flex flex-col">
              <div className="flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                <span className="font-medium">Exchange Status:</span>
              </div>
              <div className="mt-2 ml-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>Gate.io <span className="text-green-600 text-sm">(Available)</span></span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>KuCoin <span className="text-green-600 text-sm">(Available)</span></span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>Binance <span className="text-green-600 text-sm">(Available - Via Global Proxy)</span></span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>Bybit <span className="text-green-600 text-sm">(Available - Via Global Proxy)</span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DataTable
          cryptoData={getPaginatedData()}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          handleSort={handleSort}
          toggleFavorite={toggleFavorite}
          timeframe={FIXED_TIMEFRAME}
          overboughtLevel={overboughtLevel}
          isLoading={isLoading}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
        />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                &lt;
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNumber;
                
                // Show first 5 pages if current page is among the first 3
                if (currentPage <= 3) {
                  pageNumber = i + 1;
                } 
                // Show last 5 pages if current page is among the last 3
                else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                }
                // Show 2 pages before and after current page
                else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 rounded ${
                      currentPage === pageNumber
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <MarketSentiment 
            exchange={selectedExchange} 
            pair="BTC/USDT" 
          />
          <FundingRates 
            exchange={selectedExchange} 
          />
        </div>
      </main>
    </div>
  );
};

export default CryptoRsiTracker;
