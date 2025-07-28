// lib/auth-cache.ts
class AuthCache {
    private cache: {
      data: any;
      timestamp: number;
      promise?: Promise<any>;
    } | null = null;
    
    private readonly CACHE_TTL = 5000; // 5 seconds cache
  
    async getAuthData(fetcher: () => Promise<any>): Promise<any> {
      const now = Date.now();
      
      // Return cached data if still valid
      if (this.cache && (now - this.cache.timestamp) < this.CACHE_TTL) {
        console.log('🎯 Using cached auth data');
        return this.cache.data;
      }
      
      // If there's already a request in progress, return that promise
      if (this.cache?.promise) {
        console.log('⏳ Auth request already in progress, waiting...');
        return this.cache.promise;
      }
      
      // Create new request
      console.log('🔄 Fetching fresh auth data');
      const promise = fetcher().then(data => {
        this.cache = {
          data,
          timestamp: now,
          promise: undefined
        };
        return data;
      }).catch(error => {
        this.cache = null;
        throw error;
      });
      
      this.cache = {
        data: null,
        timestamp: now,
        promise
      };
      
      return promise;
    }
    
    clear() {
      this.cache = null;
    }
  }
  
  export const authCache = new AuthCache();
  