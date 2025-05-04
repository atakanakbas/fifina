import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Exchange {
  id: number;
  name: string;
  api_url: string;
  is_active: boolean;
}

interface Cryptocurrency {
  id: number;
  symbol: string;
  name: string | null;
}

interface CryptoPrice {
  id: number;
  exchange_id: number;
  crypto_id: number;
  pair: string;
  price: number;
  volume_24h: number | null;
  change_24h: number | null;
  rsi: number | null;
  last_updated: string;
}

export const CryptoDataDisplay: React.FC = () => {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch exchanges and cryptocurrencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exchangesRes, cryptoRes] = await Promise.all([
          axios.get('/api/exchanges'),
          axios.get('/api/cryptocurrencies')
        ]);
        
        setExchanges(exchangesRes.data.data);
        setCryptocurrencies(cryptoRes.data.data);
      } catch (err) {
        console.error('Error fetching reference data:', err);
        setError('Failed to fetch exchanges and cryptocurrencies');
      }
    };

    fetchData();
  }, []);

  // Fetch crypto prices
  useEffect(() => {
    const fetchCryptoPrices = async () => {
      setIsLoading(true);
      try {
        const url = selectedExchange 
          ? `/api/crypto-data?exchange=${selectedExchange}`
          : '/api/crypto-data';
          
        const response = await axios.get(url);
        setCryptoPrices(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching crypto data:', err);
        setError('Failed to fetch cryptocurrency data');
        toast({
          title: 'Error',
          description: 'Failed to fetch cryptocurrency data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCryptoPrices();
  }, [selectedExchange, toast]);

  // Get exchange name by ID
  const getExchangeName = (exchangeId: number) => {
    const exchange = exchanges.find(e => e.id === exchangeId);
    return exchange ? exchange.name : 'Unknown';
  };

  // Get crypto symbol by ID
  const getCryptoSymbol = (cryptoId: number) => {
    const crypto = cryptocurrencies.find(c => c.id === cryptoId);
    return crypto ? crypto.symbol : 'Unknown';
  };

  // Format price with proper decimal places
  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(4);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Cryptocurrency Data</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Exchange
        </label>
        <select
          className="block w-full p-2 border border-gray-300 rounded-md"
          value={selectedExchange || ''}
          onChange={(e) => setSelectedExchange(e.target.value || null)}
        >
          <option value="">All Exchanges</option>
          {exchanges.map((exchange) => (
            <option key={exchange.id} value={exchange.name}>
              {exchange.name}
            </option>
          ))}
        </select>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exchange
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pair
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  24h Change
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RSI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cryptoPrices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    No data available. Use the sync tool to fetch cryptocurrency data.
                  </td>
                </tr>
              ) : (
                cryptoPrices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-100">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {getExchangeName(price.exchange_id)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                      {price.pair}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      ${formatPrice(price.price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {price.change_24h !== null && (
                        <span className={price.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {price.change_24h >= 0 ? '+' : ''}{price.change_24h.toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {price.volume_24h !== null && (
                        <span>${price.volume_24h.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {price.rsi !== null && price.rsi.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(price.last_updated).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CryptoDataDisplay;