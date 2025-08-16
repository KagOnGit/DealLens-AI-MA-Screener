import redis
import json
import logging
from typing import Optional, Any
from ..core.config import settings

logger = logging.getLogger(__name__)

# Redis connection
redis_client = None


def get_redis():
    """Get Redis client instance."""
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            # Test connection
            redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            redis_client = None
    return redis_client


async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache."""
    try:
        client = get_redis()
        if not client:
            return None
            
        value = client.get(key)
        if value:
            return json.loads(value)
    except Exception as e:
        logger.error(f"Cache get error for key {key}: {e}")
    return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> bool:
    """Set value in cache with TTL in seconds."""
    try:
        client = get_redis()
        if not client:
            return False
            
        json_value = json.dumps(value, default=str)
        return client.setex(key, ttl, json_value)
    except Exception as e:
        logger.error(f"Cache set error for key {key}: {e}")
        return False


async def cache_delete(key: str) -> bool:
    """Delete key from cache."""
    try:
        client = get_redis()
        if not client:
            return False
            
        return client.delete(key) > 0
    except Exception as e:
        logger.error(f"Cache delete error for key {key}: {e}")
        return False


async def cache_clear_pattern(pattern: str) -> int:
    """Clear all keys matching pattern."""
    try:
        client = get_redis()
        if not client:
            return 0
            
        keys = client.keys(pattern)
        if keys:
            return client.delete(*keys)
        return 0
    except Exception as e:
        logger.error(f"Cache clear pattern error for {pattern}: {e}")
        return 0


def cache_key(namespace: str, *args) -> str:
    """Generate cache key from namespace and arguments."""
    key_parts = [namespace] + [str(arg) for arg in args]
    return ":".join(key_parts)


# Cache decorators
def cached(ttl: int = 300, key_prefix: str = "api"):
    """Decorator for caching function results."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix, func.__name__] + [str(arg) for arg in args]
            if kwargs:
                key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
            key = ":".join(key_parts)
            
            # Try to get from cache
            cached_result = await cache_get(key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {key}")
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            if result is not None:
                await cache_set(key, result, ttl)
                logger.debug(f"Cache set for {key}")
            
            return result
        return wrapper
    return decorator
