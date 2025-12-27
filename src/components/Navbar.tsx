'use client';

import Link from 'next/link';
import React from 'react';
import { TrendingUp, Newspaper, Globe, Menu, IndianRupee, DollarSign, Search as SearchIcon, ScatterChart, Brain, X } from 'lucide-react';
import Search from './Search';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const AuthButtons = dynamic(() => import('./AuthButtons'), { ssr: false });
const MobileAuthButtons = dynamic(() => import('./MobileAuthButtons'), { ssr: false });

const Navbar = () => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo Section - Hide on mobile when search is open */}
          <Link href="/" className={`flex items-center gap-2 group flex-shrink-0 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
             <div className="relative p-1.5 md:p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg md:rounded-xl shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 group-hover:scale-105 transition-all duration-300 ring-1 ring-white/20">
                <ScatterChart className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
             </div>
            <span className="text-base md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-950 to-indigo-900 dark:from-white dark:to-indigo-200 tracking-tight whitespace-nowrap">
              Tensor Terminal
            </span>
          </Link>
          
          {/* Search Bar - Desktop Centered */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
              <Search />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-1 mr-4">
              {isSignedIn && (
                <>
                <>
                  <NavLink href="/watchlist/indian" icon={<IndianRupee size={16} />} text="Watchlist (₹)" active={isActive('/watchlist/indian')} />
                  <NavLink href="/watchlist/us" icon={<DollarSign size={16} />} text="Watchlist ($)" active={isActive('/watchlist/us')} />
                </>
                </>
              )}
              <NavLink href="/global-market" icon={<Globe size={16} />} text="Global Markets" active={isActive('/global-market')} />
              <NavLink href="/ai-sentiment" icon={<Brain size={16} />} text="AI Sentiment" active={isActive('/ai-sentiment')} />
              <NavLink href="/news" icon={<Newspaper size={16} />} text="News" active={isActive('/news')} />
            </div>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mr-4" />
            
            <div className="flex items-center gap-3">
              <AuthButtons />
            </div>
          </div>

          {/* Mobile Right Section */}
          <div className="flex md:hidden items-center gap-2 flex-1 justify-end">
              {isMobileSearchOpen ? (
                  <div className="flex w-full items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
                      <div className="flex-1">
                          <Search />
                      </div>
                      <button 
                        onClick={() => setIsMobileSearchOpen(false)}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0"
                      >
                          <X size={20} />
                      </button>
                  </div>
              ) : (
                  <>
                      <button 
                        onClick={() => setIsMobileSearchOpen(true)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                          <SearchIcon size={20} />
                      </button>
                      <MobileAuthButtons />
                  </>
              )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation (Scrollable) */}
      <div className="md:hidden border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md">
           <div className="flex items-center gap-3 p-2 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
               
               {/* Nav Items */}
                {isSignedIn && (
                   <>
                   <>
                    <MobileNavChip href="/watchlist/indian" icon={<IndianRupee size={14} />} text="Watchlist (₹)" active={isActive('/watchlist/indian')} />
                    <MobileNavChip href="/watchlist/us" icon={<DollarSign size={14} />} text="Watchlist ($)" active={isActive('/watchlist/us')} />
                   </>
                   </>
                )}
                <MobileNavChip href="/global-market" icon={<Globe size={14} />} text="Global Markets" active={isActive('/global-market')} />
                <MobileNavChip href="/ai-sentiment" icon={<Brain size={14} />} text="AI Sentiment" active={isActive('/ai-sentiment')} />
                <MobileNavChip href="/news" icon={<Newspaper size={14} />} text="News" active={isActive('/news')} />
           </div>
      </div>
    </nav>
  );
};

function NavLink({ href, icon, text, active }: { href: string; icon: React.ReactNode; text: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active 
                ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
            {icon}
            <span>{text}</span>
        </Link>
    );
}

function MobileNavChip({ href, icon, text, active }: { href: string; icon: React.ReactNode; text: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex flex-shrink-0 items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors rounded-lg ${
                 active
                 ? 'text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10'
                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
            {icon}
            <span>{text}</span>
        </Link>
    );
}

export default Navbar;
