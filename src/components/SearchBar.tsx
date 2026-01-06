
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search products...",
  className = "w-full max-w-sm mb-6 mx-auto",
  initialValue = ""
}) => {
  const [query, setQuery] = useState(initialValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Instant search - البحث الفوري أثناء الكتابة
    onSearch(newQuery);
  };

  return (
    <form 
      onSubmit={handleSearch} 
      className={`flex items-center space-x-2 min-h-[44px] ${className}`}
    >
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-10 pr-4 py-2 w-full border-green-300 focus:border-green-500 focus:ring-green-500 bg-white dark:bg-gray-800 dark:border-green-900 dark:text-gray-100"
        />
      </div>
      <Button 
        type="submit" 
        className="bg-green-800 hover:bg-green-700 text-white"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
