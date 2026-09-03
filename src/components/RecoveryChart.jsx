import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { currencyConversions } from '../services/mockData';
import { isDemoMode } from '../config/dataMode';
import { dashboardDemoData } from '../data/demoData';
import { api } from '../lib/api';

export default function RecoveryChart({ currency }) {
  const isDemo = isDemoMode();
  const [activeTab, setActiveTab] = useState('30 Days');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Multiplier from currency conversion
  const conv = currencyConversions[currency] || currencyConversions.INR;

  // Load analytics recovery metrics from backend only in live mode
  useEffect(() => {
    if (isDemo) {
      setChartData(dashboardDemoData.chartData[activeTab] || dashboardDemoData.chartData['30 Days']);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await api.getAnalytics();
        setChartData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load chart analytics data:', err.message);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [isDemo, activeTab]);

  const hasData = chartData && chartData.length > 0;

  // Convert values based on current currency
  const convertedData = (chartData || []).map(item => ({
    name: item.date,
    'Revenue at Risk': Math.round((item.revenueAtRisk || 0) * conv.rate),
    'Revenue Recovered': Math.round((item.recoveredRevenue || 0) * conv.rate)
  }));

  const formatYAxis = (tickItem) => {
    return `${conv.symbol}${tickItem.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card-bg border border-border-light p-3 rounded-lg shadow-md text-xs">
          <p className="font-bold text-navy-dark mb-1">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color }} className="font-semibold">
              {p.name}: {conv.symbol}{p.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card-bg p-6 rounded-xl border border-border-light shadow-sm flex flex-col h-[380px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-lg font-bold text-navy-dark leading-none">Revenue Recovery</h2>
          <p className="text-xs text-secondary-text mt-1">Real-time recovered yield vs critical payment risks.</p>
        </div>
        
        {/* Days filters */}
        <div className="flex bg-bg-light p-1 rounded-lg border border-border-light self-start">
          {['7 Days', '30 Days', '90 Days'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (isDemo) {
                  setChartData(dashboardDemoData.chartData[tab] || dashboardDemoData.chartData['30 Days']);
                }
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${activeTab === tab ? 'bg-card-bg text-primary shadow-sm' : 'text-secondary-text hover:text-navy-dark'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full text-xs flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={convertedData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#002155" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#002155" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0096FF" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0096FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCE8F5" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#52627A" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                tickFormatter={formatYAxis} 
                stroke="#52627A" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="Revenue at Risk" 
                stroke="#002155" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorRisk)" 
              />
              <Area 
                type="monotone" 
                dataKey="Revenue Recovered" 
                stroke="#0096FF" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorRecovered)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full border border-dashed border-border-light rounded-xl p-8 flex flex-col items-center justify-center text-center bg-bg-light/10">
            <span className="text-navy-dark font-extrabold text-sm block mb-1">No recovery data available yet.</span>
            <p className="text-secondary-text text-xs max-w-sm leading-normal">
              Connect Razorpay Test Mode or import transaction data to view recovery analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
