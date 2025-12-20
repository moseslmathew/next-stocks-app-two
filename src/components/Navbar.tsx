'use client';

import Link from 'next/link';
import React from 'react';
import { TrendingUp, Newspaper, Globe, Menu, IndianRupee, DollarSign, Search as SearchIcon } from 'lucide-react';
import Search from './Search';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const AuthButtons = dynamic(() => import('./AuthButtons'), { ssr: false });
const MobileAuthButtons = dynamic(() => import('./MobileAuthButtons'), { ssr: false });

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 group-hover:shadow-blue-500/30 transition-all duration-300">
                <TrendingUp className="w-5 h-5" />
             </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">
              MarketPro
            </span>
          </Link>
          
          {/* Search Bar - Centered */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
              <Search />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-1 mr-4">
              <NavLink href="/watchlist/indian" icon={<IndianRupee size={16} />} text="India" active={isActive('/watchlist/indian')} />
              <NavLink href="/watchlist/us" icon={<DollarSign size={16} />} text="US" active={isActive('/watchlist/us')} />
              <NavLink href="/global-market" icon={<Globe size={16} />} text="Global" active={isActive('/global-market')} />
              <NavLink href="/news" icon={<Newspaper size={16} />} text="News" active={isActive('/news')} />
            </div>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mr-4" />
            
            <div className="flex items-center gap-3">
              <AuthButtons />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
             <MobileAuthButtons />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 md:hidden shadow-xl animate-in slide-in-from-top-5">
          <div className="p-4 space-y-4">
             <div className="mb-4">
                <Search />
             </div>
             <div className="space-y-1">
                <MobileLink href="/watchlist/indian" icon={<IndianRupee size={18} />} text="Indian Markets" onClick={() => setIsOpen(false)} />
                <MobileLink href="/watchlist/us" icon={<DollarSign size={18} />} text="US Markets" onClick={() => setIsOpen(false)} />
                <MobileLink href="/global-market" icon={<Globe size={18} />} text="Global Markets" onClick={() => setIsOpen(false)} />
                <MobileLink href="/news" icon={<Newspaper size={18} />} text="Market News" onClick={() => setIsOpen(false)} />
             </div>
          </div>
        </div>
      )}
    </nav>
  );
};

function NavLink({ href, icon, text, active }: { href: string; icon: React.ReactNode; text: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active 
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
            {icon}
            <span>{text}</span>
        </Link>
    );
}

function MobileLink({ href, icon, text, onClick }: { href: string; icon: React.ReactNode; text: string; onClick: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
        >
            <div className="text-gray-500 dark:text-gray-400">{icon}</div>
            {text}
        </Link>
    );
}

export default Navbar;
