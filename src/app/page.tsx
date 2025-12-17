import { ArrowRight, TrendingUp, BarChart3, Globe2 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium animate-fade-in">
          <TrendingUp size={16} />
          <span>Real-time market analysis is now live</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent pb-4">
          Master the Markets with Precision
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Track stocks, analyze trends, and make informed decisions with our professional-grade tools.
          Start building your portfolio today.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/watchlist" className="group flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/20">
            Get Started
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/global-market" className="px-8 py-4 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold transition-all">
            View Markets
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-12">
        <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
          <p className="text-gray-600 dark:text-gray-400">Professional charting tools and technical indicators at your fingertips.</p>
        </div>
        
        <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
           <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
            <Globe2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Global & Indian Coverage</h3>
          <p className="text-gray-600 dark:text-gray-400">Real-time data from NSE, BSE, and major global exchanges like NYSE and Nasdaq.</p>
        </div>
        
        <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
           <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Smart Watchlists</h3>
          <p className="text-gray-600 dark:text-gray-400">Organize and track your favorite assets with custom alerts and notifications.</p>
        </div>
      </div>
    </div>
  );
}
