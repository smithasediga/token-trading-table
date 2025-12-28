'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  ArrowUpDown, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Filter,
  X,
  Search,
  Clock,
  Activity
} from 'lucide-react';

// Types
interface Token {
  id: string;
  name: string;
  symbol: string;
  contractAddress: string;
  logo: string;
  age: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  holders: number;
  devHoldingPercent: number;
  snipersPercent: number;
  proTradersPercent: number;
  transactions: number;
  buys: number;
  sells: number;
  price: number;
  priceChange24h: number;
  platform: 'pumpfun' | 'moonshot' | 'raydium';
}

type Category = 'new-pairs' | 'final-stretch' | 'migrated';
type SortField = keyof Token;

// Utils
const formatNumber = (num: number, decimals = 2): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

const formatCurrency = (num: number) => `$${formatNumber(num)}`;
const formatPercent = (num: number) => `${num.toFixed(2)}%`;

const formatAge = (minutes: number): string => {
  if (minutes < 1) return `${Math.floor(minutes * 60)}s`;
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

// Mock Data Generator
const generateToken = (category: Category, index: number): Token => {
  const names = ['PEPE', 'DOGE', 'SHIB', 'BONK', 'WIF', 'FLOKI', 'SAMO', 'WOJAK'];
  const name = `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 9999)}`;
  
  const ranges = {
    'new-pairs': { age: [0.5, 30], marketCap: [1000, 50000], liquidity: [500, 10000] },
    'final-stretch': { age: [30, 180], marketCap: [20000, 100000], liquidity: [5000, 25000] },
    'migrated': { age: [60, 360], marketCap: [50000, 500000], liquidity: [10000, 100000] }
  };
  
  const r = ranges[category];
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  
  return {
    id: `${category}-${index}`,
    name,
    symbol: name.substring(0, 4).toUpperCase(),
    contractAddress: Math.random().toString(36).substring(2, 15),
    logo: `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`,
    age: random(...r.age),
    marketCap: random(...r.marketCap),
    liquidity: random(...r.liquidity),
    volume24h: random(1000, 100000),
    holders: Math.floor(random(10, 1000)),
    devHoldingPercent: random(0, 15),
    snipersPercent: random(0, 25),
    proTradersPercent: random(5, 40),
    transactions: Math.floor(random(50, 5000)),
    buys: Math.floor(random(25, 3000)),
    sells: Math.floor(random(20, 2500)),
    price: random(0.000001, 0.1),
    priceChange24h: random(-50, 150),
    platform: ['pumpfun', 'moonshot', 'raydium'][Math.floor(Math.random() * 3)] as any
  };
};

// Skeleton Component
const Skeleton = memo(({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
));

Skeleton.displayName = 'Skeleton';

// Price Change Cell with animation
const PriceChangeCell = memo(({ value, previousValue }: { value: number; previousValue?: number }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);
  
  const isPositive = value > 0;
  const bgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  const textColor = isPositive ? 'text-green-500' : 'text-red-500';
  const animationClass = isAnimating ? 'scale-110' : 'scale-100';
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded ${bgColor} transition-all duration-500 ${animationClass}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span className={`text-xs font-medium ${textColor}`}>{formatPercent(Math.abs(value))}</span>
    </div>
  );
});

PriceChangeCell.displayName = 'PriceChangeCell';

// Tooltip Component
const Tooltip = memo(({ content, children }: { content: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </div>
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

// Token Row Component
const TokenRow = memo(({ 
  token, 
  onQuickBuy,
  previousPrice
}: { 
  token: Token; 
  onQuickBuy: (token: Token) => void;
  previousPrice?: number;
}) => (
  <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full" />
        <div>
          <div className="font-medium text-white">{token.name}</div>
          <div className="text-xs text-gray-400">{token.symbol}</div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-gray-300">{formatAge(token.age)}</td>
    <td className="px-4 py-3 text-gray-300">{formatCurrency(token.marketCap)}</td>
    <td className="px-4 py-3 text-gray-300">{formatCurrency(token.liquidity)}</td>
    <td className="px-4 py-3 text-gray-300">{formatCurrency(token.volume24h)}</td>
    <td className="px-4 py-3 text-gray-300">{token.holders}</td>
    <td className="px-4 py-3">
      <Tooltip content="Developer holding percentage">
        <span className="text-gray-300">{formatPercent(token.devHoldingPercent)}</span>
      </Tooltip>
    </td>
    <td className="px-4 py-3">
      <Tooltip content="Sniper bot percentage">
        <span className="text-gray-300">{formatPercent(token.snipersPercent)}</span>
      </Tooltip>
    </td>
    <td className="px-4 py-3">
      <Tooltip content="Professional traders percentage">
        <span className="text-gray-300">{formatPercent(token.proTradersPercent)}</span>
      </Tooltip>
    </td>
    <td className="px-4 py-3 text-gray-300">{token.transactions}</td>
    <td className="px-4 py-3 text-green-500">{token.buys}</td>
    <td className="px-4 py-3 text-red-500">{token.sells}</td>
    <td className="px-4 py-3">
      <PriceChangeCell value={token.priceChange24h} previousValue={previousPrice} />
    </td>
    <td className="px-4 py-3">
      <button
        onClick={() => onQuickBuy(token)}
        className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
      >
        <Zap className="w-5 h-5 fill-current" />
      </button>
    </td>
  </tr>
));

TokenRow.displayName = 'TokenRow';

// Table Header with Sorting
const TableHeader = memo(({ 
  label, 
  field, 
  sortField, 
  sortDirection, 
  onSort,
  tooltip
}: { 
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  tooltip?: string;
}) => {
  const isActive = sortField === field;
  
  return (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        {tooltip ? (
          <Tooltip content={tooltip}>
            <span className="flex items-center gap-1">
              {label}
              <Info className="w-3 h-3" />
            </span>
          </Tooltip>
        ) : label}
        <ArrowUpDown className={`w-3 h-3 ${isActive ? 'text-blue-500' : ''}`} />
      </div>
    </th>
  );
});

TableHeader.displayName = 'TableHeader';

// Main Component
export default function TokenTradingTable() {
  const [activeTab, setActiveTab] = useState<Category>('new-pairs');
  const [tokens, setTokens] = useState<Record<Category, Token[]>>({
    'new-pairs': [],
    'final-stretch': [],
    'migrated': []
  });
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('age');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [previousPrices, setPreviousPrices] = useState<Map<string, number>>(new Map());
  
  // Initialize data
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setTokens({
        'new-pairs': Array.from({ length: 20 }, (_, i) => generateToken('new-pairs', i)),
        'final-stretch': Array.from({ length: 20 }, (_, i) => generateToken('final-stretch', i)),
        'migrated': Array.from({ length: 20 }, (_, i) => generateToken('migrated', i))
      });
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // WebSocket simulation for real-time updates
  useEffect(() => {
    if (loading) return;
    
    const interval = setInterval(() => {
      setTokens(prev => {
        const updated = { ...prev };
        const category = activeTab;
        const tokensToUpdate = updated[category];
        
        if (tokensToUpdate.length > 0) {
          const randomIndex = Math.floor(Math.random() * tokensToUpdate.length);
          const token = tokensToUpdate[randomIndex];
          
          // Store previous price
          setPreviousPrices(prevMap => {
            const newMap = new Map(prevMap);
            newMap.set(token.id, token.priceChange24h);
            return newMap;
          });
          
          const priceChange = (Math.random() - 0.5) * 10;
          tokensToUpdate[randomIndex] = {
            ...token,
            price: token.price * (1 + priceChange / 100),
            priceChange24h: token.priceChange24h + priceChange,
            volume24h: token.volume24h * (1 + (Math.random() - 0.5) * 0.1)
          };
        }
        
        return updated;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [loading, activeTab]);
  
  // Sorting
  const handleSort = useCallback((field: SortField) => {
    setSortDirection(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortField(field);
  }, [sortField]);
  
  // Filtered and sorted tokens
  const displayedTokens = useMemo(() => {
    let filtered = tokens[activeTab].filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      return aVal > bVal ? modifier : -modifier;
    });
  }, [tokens, activeTab, searchTerm, sortField, sortDirection]);
  
  const handleQuickBuy = useCallback((token: Token) => {
    setSelectedToken(token);
    setShowQuickBuy(true);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Token Discovery - Pulse</h1>
          <p className="text-gray-400">Real-time token tracking across platforms</p>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-gray-800">
          {[
            { key: 'new-pairs', label: 'New Pairs', icon: Clock },
            { key: 'final-stretch', label: 'Final Stretch', icon: TrendingUp },
            { key: 'migrated', label: 'Migrated', icon: Activity }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as Category)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${
                activeTab === key 
                  ? 'text-blue-500' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {activeTab === key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by token name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
        
        {/* Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <TableHeader label="Token" field="name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHeader label="Age" field="age" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} tooltip="Time since token creation" />
                    <TableHeader label="Market Cap" field="marketCap" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHeader label="Liquidity" field="liquidity" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHeader label="Volume 24h" field="volume24h" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHeader label="Holders" field="holders" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHeader label="Dev %" field="devHoldingPercent" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} tooltip="Developer holding percentage" />
                    <TableHeader label="Snipers %" field="snipersPercent" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} tooltip="Bot sniper percentage" />
                    <TableHeader label="Pro %" field="proTradersPercent" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} tooltip="Professional traders percentage" />
                    <TableHeader label="TXs" field="transactions" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHeader label="Buys" field="buys" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHeader label="Sells" field="sells" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHeader label="24h %" field="priceChange24h" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTokens.map(token => (
                    <TokenRow 
                      key={token.id} 
                      token={token} 
                      onQuickBuy={handleQuickBuy}
                      previousPrice={previousPrices.get(token.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Quick Buy Modal */}
        {showQuickBuy && selectedToken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQuickBuy(false)}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Quick Buy</h3>
                <button onClick={() => setShowQuickBuy(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <img src={selectedToken.logo} alt={selectedToken.name} className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-bold text-lg">{selectedToken.name}</div>
                  <div className="text-gray-400">{selectedToken.symbol}</div>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="font-medium">${selectedToken.price.toFixed(8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="font-medium">{formatCurrency(selectedToken.marketCap)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">24h Change</span>
                  <PriceChangeCell value={selectedToken.priceChange24h} />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
                <input
                  type="number"
                  defaultValue="0.1"
                  step="0.1"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 fill-current" />
                  Execute Quick Buy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}