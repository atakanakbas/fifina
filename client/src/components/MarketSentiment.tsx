import React, { useState, useEffect } from "react";
import * as echarts from "echarts";
import { MarketSentiment as MarketSentimentType } from "@/lib/types";

interface MarketSentimentProps {
  exchange: string;
  pair: string;
}

const MarketSentiment: React.FC<MarketSentimentProps> = ({ exchange, pair }) => {
  const [sentimentData, setSentimentData] = useState<MarketSentimentType>({
    timestamp: Date.now(),
    longShortRatio: 1.43,
    longPercentage: 58.9,
    shortPercentage: 41.1,
    totalLongs: 234560000,
    totalShorts: 163895000,
  });
  const chartRef = React.useRef<HTMLDivElement>(null);
  const chartInstance = React.useRef<echarts.ECharts | null>(null);

  // In a real application, you would fetch this data from an API
  useEffect(() => {
    // Simulate data changes based on exchange and pair
    const longPct = 50 + Math.random() * 25;
    const shortPct = 100 - longPct;
    
    setSentimentData({
      timestamp: Date.now(),
      longShortRatio: parseFloat((longPct / shortPct).toFixed(2)),
      longPercentage: parseFloat(longPct.toFixed(1)),
      shortPercentage: parseFloat(shortPct.toFixed(1)),
      totalLongs: Math.round(200000000 + Math.random() * 100000000),
      totalShorts: Math.round(150000000 + Math.random() * 100000000),
    });
  }, [exchange, pair]);

  // Initialize the chart
  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      
      chartInstance.current = echarts.init(chartRef.current);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          show: false
        },
        series: [
          {
            name: 'Long/Short Positions',
            type: 'pie',
            radius: ['55%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: true,
              position: 'center',
              formatter: '{b}\n{d}%',
              fontSize: 14,
              fontWeight: 'bold'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            data: [
              { 
                value: sentimentData.longPercentage, 
                name: 'Long', 
                itemStyle: { color: '#22c55e' } 
              },
              { 
                value: sentimentData.shortPercentage, 
                name: 'Short', 
                itemStyle: { color: '#ef4444' } 
              }
            ]
          }
        ]
      };
      
      chartInstance.current.setOption(option);
    }
    
    // Clean up
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [sentimentData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Format numbers to human-readable form
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">Market Sentiment</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut chart */}
        <div className="flex flex-col">
          <div 
            ref={chartRef} 
            className="w-full h-64"
          ></div>
          <div className="text-center text-lg font-medium mt-2">
            Long/Short Ratio: <span className={sentimentData.longShortRatio >= 1 ? "text-green-500" : "text-red-500"}>
              {sentimentData.longShortRatio}
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-col justify-center space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Long</span>
              <span className="text-sm font-medium text-green-500">{sentimentData.longPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${sentimentData.longPercentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatNumber(sentimentData.totalLongs)} USDT
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Short</span>
              <span className="text-sm font-medium text-red-500">{sentimentData.shortPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-red-500 h-2.5 rounded-full" 
                style={{ width: `${sentimentData.shortPercentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatNumber(sentimentData.totalShorts)} USDT
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            <div className="flex items-center">
              <i className="fas fa-clock mr-1"></i>
              Last updated: {new Date(sentimentData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSentiment;