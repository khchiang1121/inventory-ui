import { useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

// Virtual scrolling configuration
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

// Calculate visible items for virtual scrolling
export const calculateVisibleItems = (
  scrollTop: number,
  config: VirtualScrollConfig,
  totalItems: number
) => {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + visibleItemsCount + overscan * 2
  );
  
  return {
    startIndex,
    endIndex,
    visibleItemsCount,
    offsetY: startIndex * itemHeight,
  };
};

// Hook for virtual scrolling
export const useVirtualScroll = <T>(
  items: T[],
  config: VirtualScrollConfig
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTop = useRef(0);
  
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLDivElement;
    scrollTop.current = target.scrollTop;
  }, []);
  
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex, offsetY } = calculateVisibleItems(
      scrollTop.current,
      config,
      items.length
    );
    
    return {
      items: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
      offsetY,
      totalHeight: items.length * config.itemHeight,
    };
  }, [items, config]);
  
  return {
    containerRef,
    visibleItems,
  };
};

// Debounced search hook
export const useDebouncedSearch = (
  callback: (value: string) => void,
  delay: number = 300
) => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );
  
  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);
  
  return debouncedCallback;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  const targetRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    
    observerRef.current = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '100px',
      ...options,
    });
    
    observerRef.current.observe(target);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);
  
  return targetRef;
};

// Image optimization utilities
export const optimizeImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  if (!url) return '';
  
  // Add image optimization parameters
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  params.append('f', 'webp'); // Prefer WebP format
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
};

// Lazy image component props
export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Memory management utilities
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const globalCache = new MemoryCache(200);

// Performance monitoring utilities
export const measurePerformance = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
};

// Batch processing for large datasets
export const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R> | R,
  batchSize: number = 10,
  delay: number = 0
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Add delay between batches to prevent blocking
    if (delay > 0 && i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
};

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicateRequest = <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
};

// Throttled function execution
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      return func.apply(null, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(null, args);
      }, remaining);
    }
  }) as T;
};

// Progressive data loading
export interface ProgressiveLoadConfig {
  initialCount: number;
  increment: number;
  maxCount?: number;
}

export const useProgressiveLoad = <T>(
  allItems: T[],
  config: ProgressiveLoadConfig
) => {
  const { initialCount, increment, maxCount = allItems.length } = config;
  const currentCount = useRef(Math.min(initialCount, maxCount));
  
  const loadMore = useCallback(() => {
    const newCount = Math.min(
      currentCount.current + increment,
      maxCount,
      allItems.length
    );
    currentCount.current = newCount;
  }, [allItems.length, increment, maxCount]);
  
  const hasMore = currentCount.current < Math.min(maxCount, allItems.length);
  const visibleItems = allItems.slice(0, currentCount.current);
  
  return {
    items: visibleItems,
    loadMore,
    hasMore,
    totalCount: allItems.length,
    visibleCount: currentCount.current,
  };
};

// Resource preloading
export const preloadResource = (
  url: string,
  type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    switch (type) {
      case 'script': {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
        break;
      }
      case 'style': {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = reject;
        document.head.appendChild(link);
        break;
      }
      case 'image': {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
        break;
      }
      case 'fetch':
      default: {
        fetch(url)
          .then(() => resolve())
          .catch(reject);
        break;
      }
    }
  });
};

// Bundle splitting utilities
export const loadChunk = async (chunkName: string): Promise<any> => {
  try {
    switch (chunkName) {
      case 'charts':
        return await import('recharts');
      case 'forms':
        return await import('react-hook-form');
      case 'dates':
        return await import('date-fns');
      default:
        throw new Error(`Unknown chunk: ${chunkName}`);
    }
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error);
    throw error;
  }
};

export default {
  calculateVisibleItems,
  useVirtualScroll,
  useDebouncedSearch,
  useIntersectionObserver,
  optimizeImageUrl,
  MemoryCache,
  globalCache,
  measurePerformance,
  processBatch,
  deduplicateRequest,
  throttle,
  useProgressiveLoad,
  preloadResource,
  loadChunk,
}; 