'use client';

import Link from 'next/link';
import React from 'react';
import { TrendingUp, Newspaper, Globe, Menu } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Search from './Search';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/watchlist/indian" className="flex items-center gap-3 group">
               <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5 text-white" />
               </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transform origin-left">
                MarketPro
              </span>
            </Link>
            
            <div className="hidden md:block w-96">
                <Search />
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              <Link
                href="/watchlist/indian"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="flex items-center justify-center px-2 h-5 bg-orange-100 dark:bg-orange-900/30 rounded-full text-[10px] font-bold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">IN</div>
                Indian Stocks
              </Link>
              <Link
                href="/watchlist/us"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="flex items-center justify-center px-2 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">US</div>
                US Stocks
              </Link>
              <Link
                href="/news"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <Newspaper size={18} />
                News
              </Link>
              <Link
                href="/global-market"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <Globe size={18} />
                Global Market
              </Link>
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-800 ml-2">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transform hover:-translate-y-0.5">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" 
                    appearance={{
                        elements: {
                            avatarBox: "w-9 h-9 border-2 border-white dark:border-gray-800 shadow-sm"
                        }
                    }}
                  />
                </SignedIn>
              </div>
            </div>
          </div>

          <div className="-mr-2 flex md:hidden items-center gap-2">
             <div className="flex items-center">
                <SignedIn>
                  <UserButton afterSignOutUrl="/" 
                    appearance={{
                        elements: {
                            avatarBox: "w-8 h-8 border-2 border-white dark:border-gray-800 shadow-sm"
                        }
                    }}
                  />
                </SignedIn>
                 <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
             </div>
            <button
              type="button"
              onClick={() => {
                console.log('Toggle menu'); 
                setIsOpen(!isOpen);
              }}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none z-50 cursor-pointer"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed top-16 left-0 w-full h-[calc(100vh-4rem)] md:hidden bg-white dark:bg-black shadow-lg z-[100] overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
             <Search />
          </div>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-black">
             <Link
                href="/watchlist/indian"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-4 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-center px-2 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">IN</div>
                Indian Stocks
              </Link>
              <Link
                href="/watchlist/us"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-4 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-center px-2 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">US</div>
                US Stocks
              </Link>
              <Link
                href="/news"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-4 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
              >
                <Newspaper size={20} />
                News
              </Link>
              <Link
                href="/global-market"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-4 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Globe size={20} />
                Global Market
              </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
