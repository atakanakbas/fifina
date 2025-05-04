import React from 'react';
import ExchangeDataSync from '../components/ExchangeDataSync';
import CryptoDataDisplay from '../components/CryptoDataDisplay';

export default function ExchangeManagement() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Exchange Data Management</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
            <ExchangeDataSync />
            <CryptoDataDisplay />
          </div>
        </div>
      </main>
    </div>
  );
}