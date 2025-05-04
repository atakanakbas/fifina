import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Exchange {
  id: number;
  name: string;
  api_url: string;
  is_active: boolean;
}

const basePairOptions = ['USDT', 'BTC', 'ETH', 'BNB'];

export const ExchangeDataSync: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [selectedBasePair, setSelectedBasePair] = useState<string>('USDT');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch available exchanges
  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const response = await axios.get('/api/exchanges');
        setExchanges(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedExchange(response.data.data[0].name);
        }
      } catch (err) {
        setError('Failed to fetch exchanges');
        console.error('Error fetching exchanges:', err);
      }
    };

    fetchExchanges();
  }, []);

  // Handle sync data
  const handleSyncData = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.post('/api/exchanges/sync', {
        exchange: selectedExchange,
        basePair: selectedBasePair
      });

      setSuccessMessage(`Successfully synchronized data from ${selectedExchange} for ${selectedBasePair}`);
      toast({
        title: 'Data Synchronized',
        description: `Successfully synchronized data from ${selectedExchange} for ${selectedBasePair}`,
        variant: 'default',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to sync data';
      setError(errorMessage);
      toast({
        title: 'Sync Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Exchange Data Synchronization</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exchange
          </label>
          <select
            className="block w-full p-2 border border-gray-300 rounded-md"
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
            disabled={isLoading}
          >
            {exchanges.length === 0 && (
              <option value="">No exchanges available</option>
            )}
            {exchanges.map((exchange) => (
              <option key={exchange.id} value={exchange.name}>
                {exchange.name} {!exchange.is_active && "(Inactive)"}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base Pair
          </label>
          <select
            className="block w-full p-2 border border-gray-300 rounded-md"
            value={selectedBasePair}
            onChange={(e) => setSelectedBasePair(e.target.value)}
            disabled={isLoading}
          >
            {basePairOptions.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
        </div>
        
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          onClick={handleSyncData}
          disabled={isLoading || !selectedExchange}
        >
          {isLoading ? 'Synchronizing...' : 'Synchronize Data'}
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          <i className="fas fa-info-circle mr-1"></i>
          This will fetch cryptocurrency data from the selected exchange and store it in the database.
        </p>
      </div>
    </div>
  );
};

export default ExchangeDataSync;