import Link from 'next/link';
import { ArrowRight, Brain, TrendingUp, Globe, Zap, BarChart2 } from 'lucide-react';
import GlobalIndices from '@/components/GlobalIndices';
import { Suspense } from 'react';
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';

export const revalidate = 60;

export const metadata = {
  title: 'MarketPro - AI-Powered Stock Analysis',
  description: 'The future of intelligent trading with AI insights and real-time data.',
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
         {/* Background Effects */}
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent dark:from-blue-900/40 opacity-70"></div>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100 via-transparent to-transparent dark:from-purple-900/40 opacity-70"></div>
         
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 dark:bg-gray-800/80 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 mb-8 shadow-sm backdrop-blur-sm animate-fade-in">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                        <Brain size={24} />
                    </div>
                    <span className="text-base font-semibold tracking-wide">AI-Powered Analysis</span>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
                    Smart Research <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                        Better Decisions
                    </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    AI-driven market analysis and real-time insights to research stocks like a pro.
                </p>

                <div className="flex justify-center gap-4 mb-8">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-600/25 hover:scale-105">
                                Sign in to know more
                                <ArrowRight size={20} />
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <Link href="/watchlist/indian" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-600/25 hover:scale-105">
                            Go to Dashboard
                            <ArrowRight size={20} />
                        </Link>
                    </SignedIn>
                </div>
            </div>

            {/* Global Indices Ticker */}
            <div className="mt-16">
                <Suspense fallback={<div className="h-24 w-full max-w-4xl mx-auto bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl animate-pulse" />}>
                     <GlobalIndices />
                </Suspense>
            </div>
         </div>
      </section>


    </div>
  );
}
