import Search from '@/components/Search';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center pt-24 px-4 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
             <SearchIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Find Stocks & ETFs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Search for companies, indices, and global assets to add to your watchlist.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700">
           <Search />
        </div>
      </div>
    </div>
  );
}
