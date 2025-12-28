import Link from 'next/link';
import QuoteTicker from '@/components/QuoteTicker';
import { ArrowRight, Brain, TrendingUp, Globe, Zap, BarChart2 } from 'lucide-react';
import GlobalIndices from '@/components/GlobalIndices';
import { Suspense } from 'react';
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';

export const revalidate = 60;

export const metadata = {
  title: 'Tensor Terminal - AI-Powered Stock Analysis',
  description: 'The future of intelligent trading with AI insights and real-time data.',
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative pt-4 md:pt-12 pb-8 lg:pb-16 overflow-hidden">
         {/* Background Effects */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-100 via-transparent to-transparent dark:from-violet-900/40 opacity-50"></div>
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-100 via-transparent to-transparent dark:from-indigo-900/40 opacity-50"></div>
         
         <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            
            {/* Global Indices Ticker */}
            <div className="mt-2 lg:mt-6">
                <Suspense fallback={<div className="h-24 w-full max-w-4xl mx-auto bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl animate-pulse" />}>
                     <GlobalIndices />
                </Suspense>
            </div>
            
            <div className="mt-6">
                <QuoteTicker />
            </div>
         </div>
      </section>


    </div>
  );
}
