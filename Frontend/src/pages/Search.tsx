import { useState } from 'react';
import { Search as SearchIcon, MapPin, X, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PostGrid } from '@/components/posts/PostGrid';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { IssueStatus, IssueCategory } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Search() {
  const { posts, searchPosts, updatePostStatus } = usePosts();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(posts);
  const [hasSearched, setHasSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all');

  const handleSearch = (value: string) => {
    setQuery(value);
    applyFilters(value, statusFilter, categoryFilter);
  };

  const applyFilters = (searchQuery: string, status: IssueStatus | 'all', category: IssueCategory | 'all') => {
    let filtered = searchQuery.trim() ? searchPosts(searchQuery) : posts;
    
    if (status !== 'all') {
      filtered = filtered.filter(p => p.status === status);
    }
    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }
    
    setResults(filtered);
    setHasSearched(searchQuery.trim() !== '' || status !== 'all' || category !== 'all');
  };

  const clearSearch = () => {
    setQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setResults(posts);
    setHasSearched(false);
  };

  const handleStatusChange = (value: IssueStatus | 'all') => {
    setStatusFilter(value);
    applyFilters(query, value, categoryFilter);
  };

  const handleCategoryChange = (value: IssueCategory | 'all') => {
    setCategoryFilter(value);
    applyFilters(query, statusFilter, value);
  };

  // Get unique locations for suggestions
  const locationSuggestions = Array.from(
    new Set(
      posts
        .flatMap(p => [p.location?.city, p.location?.village, p.location?.address])
        .filter(Boolean)
    )
  ).slice(0, 6);

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0);

  return (
    <AppLayout showLogo={false} title="Search">
      <div className="p-4 space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by location, city, or issue..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="w-5 h-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Issues</SheetTitle>
                <SheetDescription>Narrow down your search results</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="unresolved">Unresolved</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="road">🛣️ Road & Traffic</SelectItem>
                      <SelectItem value="water">💧 Water Supply</SelectItem>
                      <SelectItem value="electricity">⚡ Electricity</SelectItem>
                      <SelectItem value="sanitation">🗑️ Sanitation</SelectItem>
                      <SelectItem value="other">📍 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={clearSearch} variant="outline" className="w-full mt-4">
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Location Suggestions */}
        {!hasSearched && locationSuggestions.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Popular Locations
            </h3>
            <div className="flex flex-wrap gap-2">
              {locationSuggestions.map((location, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(location!)}
                  className="px-3 py-1.5 text-sm bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {location}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="border-t border-border">
          {results.length > 0 ? (
            <>
              <p className="px-4 py-3 text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
              <PostGrid 
                posts={results} 
                showAdminActions={isAdmin}
                onStatusChange={updatePostStatus}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <SearchIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try searching for a different location or adjusting filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial State - Show all posts */}
      {!hasSearched && (
        <div className="border-t border-border">
          <p className="px-4 py-3 text-sm text-muted-foreground">
            Recent issues in your area
          </p>
          <PostGrid 
            posts={posts} 
            showAdminActions={isAdmin}
            onStatusChange={updatePostStatus}
          />
        </div>
      )}
    </AppLayout>
  );
}
