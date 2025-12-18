import Link from 'next/link';
import { TrendingUp, Newspaper, Globe, Menu } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Search from './Search';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
               <div className="bg-blue-600 p-1.5 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
               </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MarketPro
              </span>
            </Link>
            
            <div className="hidden md:block w-96">
                <Search />
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/watchlist/indian"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <div className="flex flex-col items-center justify-center w-5 h-5 bg-orange-100 dark:bg-orange-900/30 rounded text-[10px] font-bold text-orange-600 dark:text-orange-400">IN</div>
                Indian Stocks
              </Link>
              <Link
                href="/watchlist/us"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <div className="flex flex-col items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400">US</div>
                US Stocks
              </Link>
              <Link
                href="/news"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <Newspaper size={18} />
                News
              </Link>
              <Link
                href="/global-market"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <Globe size={18} />
                Global Market
              </Link>
              
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-800">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
