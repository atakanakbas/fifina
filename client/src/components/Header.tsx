import React from "react";

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <i className="fas fa-chart-line text-yellow-400 text-2xl mr-2"></i>
            <h1 className="text-xl font-bold">Binance RSI Tracker</h1>
          </div>
          <nav className="hidden md:flex space-x-6 ml-10">
            <a
              href="#"
              className="text-white hover:text-yellow-400 transition-colors cursor-pointer"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Settings
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Help
            </a>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center text-sm text-gray-300">
            <i className="fas fa-circle text-green-500 text-xs mr-1"></i>
            <span>Connected</span>
          </div>
          <div className="relative cursor-pointer">
            <i className="fas fa-user-circle text-xl"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
