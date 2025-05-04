export interface CryptoData {
  id: number;
  pair: string;
  price: number;
  rsi: number;
  change24h: number;
  volume: string;
  isFavorite: boolean;
  exchange: string;
}

// Flexible version that allows null entries during processing
export type FlexibleCryptoData = CryptoData | null;

export interface MarketSentiment {
  timestamp: number;
  longShortRatio: number;
  longPercentage: number;
  shortPercentage: number;
  totalLongs: number;
  totalShorts: number;
}

export interface FundingRate {
  symbol: string;
  rate: number;
  timestamp: number;
}

export type ExchangeOption = "All" | "Binance" | "Gate" | "Kucoin" | "Bybit";
export type TimeframeOption = "15m" | "1h" | "4h" | "1d" | "1w";
export type BasePairOption = "USDT" | "BTC" | "ETH" | "BNB";
export type SortColumn = "pair" | "price" | "rsi" | "change24h" | "volume";
export type SortDirection = "asc" | "desc";
