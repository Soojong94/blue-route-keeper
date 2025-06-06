// src/components/SmartInput.tsx - 완전히 새로운 접근법
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Search, MapPin, Car, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchResult {
  id: string;
  value: string;
  label: string;
  type: 'exact' | 'favorite' | 'recent' | 'search';
  category?: 'vehicle' | 'location' | 'driver' | 'general';
  metadata?: any;
}

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  searchFunction: (query: string) => Promise<SearchResult[]>;
  recentItems?: string[];
  favoriteItems?: SearchResult[];
  disabled?: boolean;
  debounceMs?: number;
}

const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "검색어 입력",
  className,
  searchFunction,
  recentItems = [],
  favoriteItems = [],
  disabled = false,
  debounceMs = 300,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Portal 대신 relative positioning 사용
  const sortResults = useCallback((results: SearchResult[]): SearchResult[] => {
    const recentResults = results.filter(r => r.type === 'recent');
    const exactResults = results.filter(r => r.type === 'exact');
    const favoriteResults = results.filter(r => r.type === 'favorite');
    const searchResultsOnly = results.filter(r => r.type === 'search');

    return [...recentResults, ...exactResults, ...favoriteResults, ...searchResultsOnly];
  }, []);

  const debouncedSearch = useCallback(async (query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!query.trim()) {
        const results: SearchResult[] = [
          ...recentItems.map((item, index) => ({
            id: `recent-${index}`,
            value: item,
            label: item,
            type: 'recent' as const,
          })),
          ...favoriteItems,
        ];
        setSearchResults(sortResults(results));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const results = await searchFunction(query);
        setSearchResults(sortResults(results));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [searchFunction, favoriteItems, recentItems, debounceMs, sortResults]);

  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
    setSelectedIndex(-1);
    debouncedSearch(newValue);
  }, [onChange, debouncedSearch]);

  const toggleDropdown = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      debouncedSearch(value);
    } else {
      setIsOpen(false);
    }
  }, [isOpen, debouncedSearch, value]);

  const handleSelect = useCallback((result: SearchResult) => {
    onChange(result.value);
    onSelect?.(result);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onChange, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const organized = organizeResults();
    const results = organized.all;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        if (!isOpen) {
          setIsOpen(true);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, selectedIndex, handleSelect]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const organizeResults = useCallback(() => {
    const sortedResults = sortResults(searchResults);
    const exactMatches = sortedResults.filter(r => r.type === 'exact');
    const favorites = sortedResults.filter(r => r.type === 'favorite');
    const recent = sortedResults.filter(r => r.type === 'recent');
    const searchMatches = sortedResults.filter(r => r.type === 'search');

    return {
      exact: exactMatches,
      favorites,
      recent,
      search: searchMatches,
      all: sortedResults
    };
  }, [searchResults, sortResults]);

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'exact':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'favorite':
        return result.category === 'vehicle'
          ? <Car className="h-4 w-4 text-blue-500" />
          : <MapPin className="h-4 w-4 text-green-500" />;
      case 'recent':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const organized = organizeResults();

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            if (!value) debouncedSearch('');
          }}
          placeholder={placeholder}
          className={cn("pr-10", className)}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleDropdown}
          disabled={disabled}
          className="ml-1 px-2"
        >
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Portal 대신 절대 위치 사용 - z-index 최대한 높게 설정 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{
            zIndex: 99999999, // 매우 높은 z-index
            position: 'absolute'
          }}
        >
          {isLoading ? (
            <div className="p-3 text-center">
              <div className="animate-spin inline-block h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-sm text-gray-500">검색 중...</span>
            </div>
          ) : (
            <>
              {/* 최근 사용 */}
              {organized.recent.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 border-b sticky top-0">
                    최근 사용 (우선)
                  </div>
                  {organized.recent.map((result, index) => {
                    const globalIndex = organized.all.indexOf(result);
                    return (
                      <div
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={cn(
                          "flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100",
                          selectedIndex === globalIndex && "bg-blue-50"
                        )}
                      >
                        {getResultIcon(result)}
                        <span className="flex-1">
                          {highlightMatch(result.label, value)}
                        </span>
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                          최근
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 정확히 일치 */}
              {organized.exact.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b sticky top-0">
                    정확히 일치
                  </div>
                  {organized.exact.map((result, index) => {
                    const globalIndex = organized.all.indexOf(result);
                    return (
                      <div
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={cn(
                          "flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100",
                          selectedIndex === globalIndex && "bg-blue-50"
                        )}
                      >
                        {getResultIcon(result)}
                        <span className="flex-1 font-medium">
                          {highlightMatch(result.label, value)}
                        </span>
                        <Badge variant="outline" className="text-xs">정확일치</Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 즐겨찾기 */}
              {organized.favorites.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b sticky top-0">
                    즐겨찾기
                  </div>
                  {organized.favorites.map((result, index) => {
                    const globalIndex = organized.all.indexOf(result);
                    return (
                      <div
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={cn(
                          "flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100",
                          selectedIndex === globalIndex && "bg-blue-50"
                        )}
                      >
                        {getResultIcon(result)}
                        <span className="flex-1">
                          {highlightMatch(result.label, value)}
                        </span>
                        {result.metadata?.category && (
                          <Badge variant="outline" className="text-xs">
                            {result.metadata.category}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 검색 결과 */}
              {organized.search.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b sticky top-0">
                    검색 결과
                  </div>
                  {organized.search.map((result, index) => {
                    const globalIndex = organized.all.indexOf(result);
                    return (
                      <div
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={cn(
                          "flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100",
                          selectedIndex === globalIndex && "bg-blue-50"
                        )}
                      >
                        {getResultIcon(result)}
                        <span className="flex-1">
                          {highlightMatch(result.label, value)}
                        </span>
                        {result.metadata?.additionalInfo && (
                          <span className="text-xs text-gray-500">
                            {result.metadata.additionalInfo}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 검색 결과 없음 */}
              {organized.all.length === 0 && !isLoading && (
                <div className="p-3 text-center text-gray-500">
                  <div className="text-sm">
                    {value ? `"${value}" 검색 결과 없음` : '검색어를 입력하세요'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartInput;