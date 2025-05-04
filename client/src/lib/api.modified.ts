import axios from "axios";
import { TimeframeOption, BasePairOption, CryptoData, FlexibleCryptoData } from "./types";
import { generateRealRSI } from "./rsiCalculation";

// Number of items to fetch per exchange - increased to show more trading pairs
const MAX_ITEMS_PER_EXCHANGE = 500;

// Helper function to format large volume numbers
export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return (volume / 1e9).toFixed(1) + 'B';
  } else if (volume >= 1e6) {
    return (volume / 1e6).toFixed(1) + 'M';
  } else if (volume >= 1e3) {
    return (volume / 1e3).toFixed(1) + 'K';
  }
  return volume.toFixed(1);
};

// Fetches ticker data from Binance
const fetchBinanceData = async (basePair: BasePairOption): Promise<CryptoData[]> => {
  try {
    // Get ticker price data through our server proxy
    const tickerResponse = await axios.get(`/api/proxy/binance/api/v3/ticker/24hr`);
    const tickerData = tickerResponse.data;
    
    // Process all tickers with good data regardless of base pair
    const processedData: FlexibleCryptoData[] = tickerData
      // Include all valid pairs with valid volume data
      .filter((ticker: any) => ticker.volume && !isNaN(parseFloat(ticker.volume)))
      .filter((ticker: any) => ticker.symbol && ticker.lastPrice)
      .map((ticker: any, index: number) => {
        // Try to extract base and quote currencies (BTC/USDT format)
        // First check common base pairs
        const basePairs = ["USDT", "BTC", "ETH", "BNB", "BUSD", "USD"];
        let baseFound = false;
        let symbol = ticker.symbol;
        let base = ""; 
        let quote = "";
        
        // Find which base pair this belongs to
        for (const possibleBase of basePairs) {
          if (symbol.endsWith(possibleBase)) {
            base = possibleBase;
            quote = symbol.substring(0, symbol.length - possibleBase.length);
            baseFound = true;
            break;
          }
        }
        
        // If no base found, try to guess using simple pattern
        if (!baseFound) {
          // Assume last 3-4 characters might be the base
          if (symbol.length > 4) {
            base = symbol.substring(symbol.length - 4);
            quote = symbol.substring(0, symbol.length - 4);
          } else {
            // For very short symbols, just use as is
            base = "UNKNOWN";
            quote = symbol;
          }
        }
        
        const pair = quote + "/" + base;
        const price = parseFloat(ticker.lastPrice);
        const volume = formatVolume(parseFloat(ticker.quoteVolume || ticker.volume));
        const change24h = parseFloat(ticker.priceChangePercent);
        
        // Calculate RSI using Wilder's formula with price history
        const rsi = 50; // Default value that will be updated async
        
        // Generate the data object with the initial RSI
        const dataObject: CryptoData = {
          id: index + 1,
          pair,
          price,
          rsi,
          change24h,
          volume,
          isFavorite: false,
          exchange: "Binance"
        };
        
        // Update RSI asynchronously
        generateRealRSI(pair, price, change24h).then(rsiValue => {
          dataObject.rsi = rsiValue;
        }).catch(error => {
          console.warn("Failed to calculate RSI for", pair, error);
        });
        
        return dataObject;
      });
    
    // Need type guard to filter out nulls
    const validData = processedData.filter((item): item is CryptoData => item !== null);
    
    // Limit the number of items if needed
    const result = MAX_ITEMS_PER_EXCHANGE > 0 
      ? validData.slice(0, MAX_ITEMS_PER_EXCHANGE) 
      : validData;
      
    return result;
  } catch (error) {
    console.error("Error fetching Binance data:", error);
    // Return empty array on error - no fallback data
    return [];
  }
};

// Fetches ticker data from Gate.io
const fetchGateData = async (basePair: BasePairOption): Promise<CryptoData[]> => {
  try {
    // Get ticker price data through our server proxy
    const tickerResponse = await axios.get(`/api/proxy/gate/spot/tickers`, {
      timeout: 5000 // Add reasonable timeout
    });
    
    // Make sure we received valid data
    if (!tickerResponse.data || !Array.isArray(tickerResponse.data)) {
      console.error("Invalid response from Gate.io API:", tickerResponse.data);
      return [];
    }
    
    const tickerData = tickerResponse.data;
    
    // Process all available trading pairs, not just the ones with the selected base pair
    const processedData: FlexibleCryptoData[] = tickerData
      // Make sure to check for valid data and matches the correct format
      .filter((ticker: any) => 
        ticker && 
        ticker.currency_pair && 
        typeof ticker.currency_pair === 'string'
      )
      .map((ticker: any, index: number) => {
        const pairRaw = ticker.currency_pair.split('_');
        // Gate.io format is typically BASE_QUOTE (e.g., BTC_USDT)
        if (pairRaw.length !== 2) {
          // Skip malformed pairs
          return null;
        }
        
        const symbol = pairRaw[0];
        const base = pairRaw[1];
        const pair = symbol + "/" + base;
        const price = parseFloat(ticker.last) || 0;
        const volume = formatVolume(parseFloat(ticker.quote_volume) || 0);
        
        // Safely handle potentially missing or invalid data
        let change24h = 0;
        try {
          if (ticker.change_percentage) {
            change24h = parseFloat(ticker.change_percentage) * 100; // Convert to percentage
            if (isNaN(change24h)) change24h = 0;
          }
        } catch (e) {
          console.warn("Error parsing change percentage:", e);
        }
        
        // Generate the data object with the initial RSI
        const dataObject: CryptoData = {
          id: index + 1000, // Offset to avoid ID conflicts
          pair,
          price,
          rsi: 50, // Default value that will be updated async  
          change24h,
          volume,
          isFavorite: false,
          exchange: "Gate"
        };
        
        // Update RSI asynchronously
        generateRealRSI(pair, price, change24h).then(rsiValue => {
          dataObject.rsi = rsiValue;
        }).catch(error => {
          console.warn("Failed to calculate RSI for", pair, error);
        });
        
        return dataObject;
      });
      
    // Need type guard to filter out nulls  
    const validData = processedData.filter((item): item is CryptoData => item !== null);
    
    // Limit the number of items if needed
    const result = MAX_ITEMS_PER_EXCHANGE > 0 
      ? validData.slice(0, MAX_ITEMS_PER_EXCHANGE) 
      : validData;
      
    return result;
  } catch (error) {
    console.error("Error fetching Gate.io data:", error);
    return [];
  }
};

// Fetches ticker data from KuCoin
const fetchKucoinData = async (basePair: BasePairOption): Promise<CryptoData[]> => {
  try {
    // Get ticker data through our server proxy with timeout
    const tickerResponse = await axios.get(`/api/proxy/kucoin/api/v1/market/allTickers`, {
      timeout: 5000
    });
    
    // Validate response structure
    if (!tickerResponse.data || 
        !tickerResponse.data.data || 
        !tickerResponse.data.data.ticker ||
        !Array.isArray(tickerResponse.data.data.ticker)) {
      console.error("Invalid response from KuCoin API:", tickerResponse.data);
      return [];
    }
    
    const tickers = tickerResponse.data.data.ticker;
    
    // Process all valid tickers with basic validation
    const processedData: FlexibleCryptoData[] = tickers
      // Validate ticker objects and symbol format
      .filter((ticker: any) => 
        ticker && 
        ticker.symbol && 
        typeof ticker.symbol === 'string'
      )
      // Include all valid pairs with volume data
      .filter((ticker: any) => 
        ticker.volValue && 
        !isNaN(parseFloat(ticker.volValue))
      )
      .map((ticker: any, index: number) => {
        // KuCoin format is BASE-QUOTE (e.g., BTC-USDT)
        const symbolParts = ticker.symbol.split('-');
        if (symbolParts.length !== 2) {
          return null; // Skip malformed pairs
        }
        
        const symbol = symbolParts[0];
        const base = symbolParts[1];
        const pair = symbol + "/" + base;
        
        // Safely parse numeric values with fallbacks
        const price = ticker.last ? parseFloat(ticker.last) : 0;
        const volume = formatVolume(ticker.volValue ? parseFloat(ticker.volValue) : 0);
        
        // Safely handle change rate
        let change24h = 0;
        try {
          if (ticker.changeRate) {
            change24h = parseFloat(ticker.changeRate) * 100; // Convert to percentage
            if (isNaN(change24h)) change24h = 0;
          }
        } catch (e) {
          console.warn("Error parsing change rate for KuCoin:", e);
        }
        
        // Generate the data object with the initial RSI
        const dataObject: CryptoData = {
          id: index + 2000, // Offset to avoid ID conflicts
          pair,
          price,
          rsi: 50, // Default value that will be updated async
          change24h,
          volume,
          isFavorite: false,
          exchange: "Kucoin"
        };
        
        // Update RSI asynchronously
        generateRealRSI(pair, price, change24h).then(rsiValue => {
          dataObject.rsi = rsiValue;
        }).catch(error => {
          console.warn("Failed to calculate RSI for", pair, error);
        });
        
        return dataObject;
      });
      
    // Need type guard to filter out nulls
    const validData = processedData.filter((item): item is CryptoData => item !== null);
    
    // Limit the number of items if needed
    const result = MAX_ITEMS_PER_EXCHANGE > 0 
      ? validData.slice(0, MAX_ITEMS_PER_EXCHANGE) 
      : validData;
      
    return result;
  } catch (error) {
    console.error("Error fetching KuCoin data:", error);
    return [];
  }
};

// Fetches ticker data from Bybit
const fetchBybitData = async (basePair: BasePairOption): Promise<CryptoData[]> => {
  try {
    // Get ticker data through our server proxy
    const tickerResponse = await axios.get(`/api/proxy/bybit/v5/market/tickers`, {
      params: { category: 'spot' }
    });
    const tickers = tickerResponse.data.result.list;
    
    // Process all tickers to include all available coins
    const processedData: FlexibleCryptoData[] = tickers
      // Include all valid pairs with volume data
      .filter((ticker: any) => ticker.volume24h && !isNaN(parseFloat(ticker.volume24h)))
      .map((ticker: any, index: number) => {
        // Extract base and quote from the symbol
        // Bybit formats are typically without separators (e.g., BTCUSDT)
        // We need to identify common base currencies and split accordingly
        const symbol = ticker.symbol;
        const baseCurrencies = ["USDT", "USD", "USDC", "BTC", "ETH", "BUSD"];
        let base = "";
        let quote = "";
        
        // Try to find a known base currency at the end of the symbol
        let baseFound = false;
        for (const baseCurrency of baseCurrencies) {
          if (symbol.endsWith(baseCurrency)) {
            base = baseCurrency;
            quote = symbol.substring(0, symbol.length - baseCurrency.length);
            baseFound = true;
            break;
          }
        }
        
        // If no base currency was found, make an educated guess
        if (!baseFound) {
          if (symbol.length > 3) {
            // Assume the last 3-4 characters might be the base currency
            base = symbol.substring(symbol.length - 4);
            quote = symbol.substring(0, symbol.length - 4);
          } else {
            // For very short symbols, just use as is
            return null; // Skip symbols we can't parse properly
          }
        }
        
        const pair = quote + "/" + base;
        const price = parseFloat(ticker.lastPrice);
        const volume = formatVolume(parseFloat(ticker.turnover24h));
        
        // Calculate 24h change percentage
        const price24hAgo = parseFloat(ticker.prevPrice24h);
        const change24h = ((price - price24hAgo) / price24hAgo) * 100;
        
        // Generate the data object with the initial RSI
        const dataObject: CryptoData = {
          id: index + 3000, // Offset to avoid ID conflicts
          pair,
          price,
          rsi: 50, // Default value that will be updated async
          change24h,
          volume,
          isFavorite: false,
          exchange: "Bybit"
        };
        
        // Update RSI asynchronously
        generateRealRSI(pair, price, change24h).then(rsiValue => {
          dataObject.rsi = rsiValue;
        }).catch(error => {
          console.warn("Failed to calculate RSI for", pair, error);
        });
        
        return dataObject;
      });
      
    // Need type guard to filter out nulls
    const validData = processedData.filter((item): item is CryptoData => item !== null);
    
    // Limit the number of items if needed
    const result = MAX_ITEMS_PER_EXCHANGE > 0 
      ? validData.slice(0, MAX_ITEMS_PER_EXCHANGE) 
      : validData;
      
    return result;
  } catch (error) {
    console.error("Error fetching Bybit data:", error);
    return [];
  }
};

// Define interface for exchange availability
interface ExchangeAvailability {
  available: boolean;
  lastChecked: number;
}

// Define interface for exchanges map
interface ExchangesMap {
  [key: string]: ExchangeAvailability;
}

// Array of available exchanges (will be updated based on connectivity)
let availableExchanges: ExchangesMap = {
  binance: { available: true, lastChecked: 0 },
  gate: { available: true, lastChecked: 0 },
  kucoin: { available: true, lastChecked: 0 },
  bybit: { available: true, lastChecked: 0 }
};

// Cache timeout in milliseconds (5 minutes)
const EXCHANGE_AVAILABILITY_CACHE_TIMEOUT = 5 * 60 * 1000;

// Function to check if an exchange should be retried
const shouldRetryExchange = (exchange: string): boolean => {
  const exchangeInfo = availableExchanges[exchange.toLowerCase()];
  if (!exchangeInfo) return true;
  
  // If marked as available, always try
  if (exchangeInfo.available) return true;
  
  // If unavailable, only retry after cache timeout
  const now = Date.now();
  return (now - exchangeInfo.lastChecked) > EXCHANGE_AVAILABILITY_CACHE_TIMEOUT;
};

// Function to mark an exchange as unavailable
const markExchangeUnavailable = (exchange: string) => {
  const exchangeLower = exchange.toLowerCase();
  if (availableExchanges[exchangeLower]) {
    availableExchanges[exchangeLower].available = false;
    availableExchanges[exchangeLower].lastChecked = Date.now();
    console.log(`Marked ${exchange} as unavailable due to API restrictions`);
  }
};

// Function to mark an exchange as available
const markExchangeAvailable = (exchange: string) => {
  const exchangeLower = exchange.toLowerCase();
  if (availableExchanges[exchangeLower]) {
    availableExchanges[exchangeLower].available = true;
    availableExchanges[exchangeLower].lastChecked = Date.now();
  }
};

// Main function to fetch data based on exchange
export const fetchCryptoData = async (
  exchange: string,
  basePair: BasePairOption,
  _timeframe: TimeframeOption = "1d" // Fixed to 1d with a period of 14
): Promise<CryptoData[]> => {
  const exchangeLower = exchange.toLowerCase();
  
  // Special case for "all" exchange to fetch data from all exchanges
  if (exchangeLower === "all") {
    try {
      // Start with always available exchanges first to ensure we get data
      const results: CryptoData[] = [];
      
      // First, try getting data from exchanges that are known to work
      // Gate.io and KuCoin are generally more accessible, so start with them
      try {
        const gateData = await fetchGateData(basePair);
        if (gateData.length > 0) {
          results.push(...gateData);
          markExchangeAvailable('gate');
        }
      } catch (error) {
        console.error("Error fetching Gate.io data:", error);
      }
      
      try {
        const kucoinData = await fetchKucoinData(basePair);
        if (kucoinData.length > 0) {
          results.push(...kucoinData);
          markExchangeAvailable('kucoin');
        }
      } catch (error) {
        console.error("Error fetching KuCoin data:", error);
      }
      
      // Try fetching from region-restricted exchanges only if we should retry them
      if (shouldRetryExchange('binance')) {
        try {
          const binanceData = await fetchBinanceData(basePair);
          if (binanceData.length > 0) {
            results.push(...binanceData);
            markExchangeAvailable('binance');
          }
        } catch (error: any) {
          console.error("Error fetching Binance data:", error);
          // Check for region restriction errors
          if (error && error.message && 
              (error.message.includes('status code 451') || 
               error.message.includes('status code 403'))) {
            markExchangeUnavailable('binance');
          }
        }
      }
      
      if (shouldRetryExchange('bybit')) {
        try {
          const bybitData = await fetchBybitData(basePair);
          if (bybitData.length > 0) {
            results.push(...bybitData);
            markExchangeAvailable('bybit');
          }
        } catch (error: any) {
          console.error("Error fetching Bybit data:", error);
          // Check for region restriction errors
          if (error && error.message && 
              (error.message.includes('status code 451') || 
               error.message.includes('status code 403'))) {
            markExchangeUnavailable('bybit');
          }
        }
      }
      
      // Return whatever data we managed to get
      return results;
    } catch (error) {
      console.error("Error fetching data from all exchanges:", error);
      return [];
    }
  }
  
  // Fetch from specific exchange
  try {
    // If this exchange is marked as unavailable and shouldn't be retried yet, 
    // fail early with an informative error message
    if (!shouldRetryExchange(exchangeLower)) {
      console.warn(`Exchange ${exchange} is currently unavailable due to API restrictions.`);
      return [];
    }
    
    let result: CryptoData[] = [];
    
    switch (exchangeLower) {
      case 'binance':
        result = await fetchBinanceData(basePair);
        break;
      case 'gate':
        result = await fetchGateData(basePair);
        break;
      case 'kucoin':
        result = await fetchKucoinData(basePair);
        break;
      case 'bybit':
        result = await fetchBybitData(basePair);
        break;
      default:
        // Default to Gate as it seems more reliable in current setup
        result = await fetchGateData(basePair);
        break;
    }
    
    // If we got some data, mark the exchange as available
    if (result.length > 0) {
      markExchangeAvailable(exchangeLower);
    }
    
    return result;
  } catch (error: any) {
    console.error(`Error fetching data from ${exchange}:`, error);
    
    // If this is a region restriction error, mark the exchange as unavailable
    if (error && error.message && 
        (error.message.includes('status code 451') || 
         error.message.includes('status code 403'))) {
      markExchangeUnavailable(exchangeLower);
    }
    
    return [];
  }
};

// Helper function to convert timeframe to milliseconds
const getTimeframeMilliseconds = (timeframe: TimeframeOption): number => {
  switch (timeframe) {
    case "15m": return 15 * 60 * 1000;
    case "1h": return 60 * 60 * 1000;
    case "4h": return 4 * 60 * 60 * 1000;
    case "1d": return 24 * 60 * 60 * 1000;
    case "1w": return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
};