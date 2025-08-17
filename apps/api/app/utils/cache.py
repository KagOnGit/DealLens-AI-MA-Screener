"""
Redis caching utilities for API responses.
"""
import redis
import json
import logging
from typing import Optional, Any, Union
from functools import wraps
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = None

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    # Test connection
    redis_client.ping()
    logger.info("Redis connected successfully")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}. Caching disabled.")
    redis_client = None


class CacheKeyBuilder:
    """Build consistent cache keys for different data types"""
    
    @staticmethod
    def company_detail(ticker: str) -> str:
        return f"company:detail:{ticker.upper()}"
    
    @staticmethod
    def company_timeseries(ticker: str) -> str:
        return f"company:timeseries:{ticker.upper()}"
    
    @staticmethod
    def company_ownership(ticker: str) -> str:
        return f"company:ownership:{ticker.upper()}"
    
    @staticmethod
    def company_news(ticker: str) -> str:
        return f"company:news:{ticker.upper()}"
    
    @staticmethod
    def deal_detail(deal_id: str) -> str:
        return f"deal:detail:{deal_id}"
    
    @staticmethod
    def deals_list(filters_hash: str) -> str:
        return f"deals:list:{filters_hash}"
    
    @staticmethod
    def search_results(query: str) -> str:
        return f"search:results:{query.lower()}"


class CacheManager:
    """Manage Redis caching operations"""
    
    def __init__(self):
        self.client = redis_client
        self.default_ttl = {
            "company_detail": 300,    # 5 minutes
            "company_timeseries": 600,  # 10 minutes
            "company_ownership": 1800,  # 30 minutes
            "company_news": 120,      # 2 minutes
            "deal_detail": 300,       # 5 minutes
            "deals_list": 60,         # 1 minute
            "search_results": 300,    # 5 minutes
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached data"""
        if not self.client:
            return None
        
        try:
            data = self.client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set cached data with TTL"""
        if not self.client:
            return False
        
        try:
            data = json.dumps(value, default=str)
            if ttl:
                return self.client.setex(key, ttl, data)
            else:
                return self.client.set(key, data)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete cached data"""
        if not self.client:
            return False
        
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.client:
            return 0
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0
    
    def invalidate_company(self, ticker: str) -> None:
        """Invalidate all cached data for a company"""
        ticker = ticker.upper()
        patterns = [
            f"company:*:{ticker}",
        ]
        
        for pattern in patterns:
            deleted = self.delete_pattern(pattern)
            if deleted > 0:
                logger.info(f"Invalidated {deleted} cache entries for {ticker}")


# Global cache manager instance
cache_manager = CacheManager()


def cached(cache_type: str, key_func, ttl: Optional[int] = None):
    """
    Decorator for caching function results
    
    Args:
        cache_type: Type of cache (for TTL lookup)
        key_func: Function to generate cache key from function args
        ttl: Custom TTL in seconds (optional)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = key_func(*args, **kwargs)
            
            # Try to get from cache first
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return cached_result
            
            # Cache miss - execute function
            logger.debug(f"Cache miss for key: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Cache the result
            cache_ttl = ttl or cache_manager.default_ttl.get(cache_type, 300)
            cache_manager.set(cache_key, result, cache_ttl)
            
            return result
        
        return wrapper
    return decorator


def hash_dict(d: dict) -> str:
    """Create a hash from dictionary for cache keys"""
    import hashlib
    content = json.dumps(d, sort_keys=True)
    return hashlib.md5(content.encode()).hexdigest()[:8]


# Convenience functions for common cache operations
def cache_company_detail(ticker: str, data: dict, ttl: int = 300) -> bool:
    """Cache company detail data"""
    key = CacheKeyBuilder.company_detail(ticker)
    return cache_manager.set(key, data, ttl)


def get_cached_company_detail(ticker: str) -> Optional[dict]:
    """Get cached company detail data"""
    key = CacheKeyBuilder.company_detail(ticker)
    return cache_manager.get(key)


def invalidate_company_cache(ticker: str) -> None:
    """Invalidate all cached data for a company"""
    cache_manager.invalidate_company(ticker)


def cache_health_check() -> dict:
    """Check cache health"""
    if not redis_client:
        return {
            "status": "disabled",
            "connection": False,
            "message": "Redis not configured"
        }
    
    try:
        redis_client.ping()
        info = redis_client.info()
        return {
            "status": "healthy",
            "connection": True,
            "used_memory": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "version": info.get("redis_version", "unknown")
        }
    except Exception as e:
        return {
            "status": "error",
            "connection": False,
            "message": str(e)
        }
