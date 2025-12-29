'use client';

import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { TrendingUp, Newspaper, Globe, Brain, BarChart3 } from 'lucide-react';

const MenuBar = () => {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pb-safe">
       <div className="flex items-center justify-around p-2">
            {isSignedIn && (
               <>
                <MobileNavChip href="/watchlist/indian" icon={<span className="text-lg font-bold">₹</span>} text="Watchlist" active={isActive('/watchlist/indian')} />
                <MobileNavChip href="/watchlist/us" icon={<span className="text-lg font-bold">$</span>} text="Watchlist" active={isActive('/watchlist/us')} />
               </>
            )}
            <MobileNavChip href="/global-market" icon={<BarChart3 size={20} />} text="Global" active={isActive('/global-market')} />
            <MobileNavChip href="/ai-sentiment" icon={<Brain size={20} />} text="AI" active={isActive('/ai-sentiment')} />
            <MobileNavChip href="/news" icon={<Newspaper size={20} />} text="News" active={isActive('/news')} />
       </div>
    </div>
  );
};

function MobileNavChip({ href, icon, text, active }: { href: string; icon: React.ReactNode; text: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                 active
                 ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
            <div className="h-6 flex items-center justify-center">
                {icon}
            </div>
            <span className="text-[10px] font-medium">{text}</span>
        </Link>
    );
}

export default MenuBar;
