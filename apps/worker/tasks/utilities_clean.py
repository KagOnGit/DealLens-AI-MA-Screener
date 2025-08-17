"""
Production utilities for Celery tasks with idempotency, rate limiting, and cost controls
"""
import hashlib
import time
import logging
import os
import json
from functools import wraps
from typing import Any, Callable, Optional
from celery import current_task
from datetime import datetime
import redis

# Redis client for caching and idempotency
try:
    redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
except Exception as e:
    logging.error(f"Failed to connect to Redis: {e}")
    redis_client = None

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiter for external API calls"""
    
    def __init__(self, service_name: str, calls_per_minute: int = 60):
        self.service_name = service_name
        self.calls_per_minute = calls_per_minute
        self.window_size = 60  # 1 minute window
    
    def is_allowed(self) -> bool:
        """Check if call is allowed within rate limit"""
        if not redis_client:
            return True  # Allow if Redis unavailable
        
        key = f"rate_limit:{self.service_name}:{int(time.time() // self.window_size)}"
        
        try:
            current_calls = redis_client.get(key)
            current_calls = int(current_calls or 0)
            
            if current_calls >= self.calls_per_minute:
                return False
            
            # Increment counter with expiration
            redis_client.incr(key)
            redis_client.expire(key, self.window_size)
            return True
        except Exception as e:
            logger.error(f"Rate limiter error for {self.service_name}: {e}")
            return True  # Allow if error (fail open)
    
    def wait_time(self) -> int:
        """Get wait time in seconds until next call is allowed"""
        current_window = int(time.time() // self.window_size)
        next_window = (current_window + 1) * self.window_size
        return int(next_window - time.time())


def rate_limited(service_name: str, calls_per_minute: int = 60):
    """Decorator to add rate limiting to tasks"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            limiter = RateLimiter(service_name, calls_per_minute)
            
            if not limiter.is_allowed():
                wait_time = limiter.wait_time()
                logger.warning(f"Rate limit hit for {service_name}, retrying in {wait_time}s")
                if hasattr(current_task, 'retry'):
                    raise current_task.retry(countdown=wait_time)
                else:
                    time.sleep(wait_time)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def idempotent(key_func: Optional[Callable] = None, ttl: int = 3600):
    """Decorator to make tasks idempotent"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not redis_client:
                return func(*args, **kwargs)
            
            # Generate idempotency key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default: hash function name and arguments
                task_signature = f"{func.__name__}:{str(args)}:{str(kwargs)}"
                cache_key = f"idempotent:{hashlib.md5(task_signature.encode()).hexdigest()}"
            
            try:
                # Check if task already completed
                cached_result = redis_client.get(cache_key)
                if cached_result is not None:
                    logger.info(f"Task {func.__name__} already completed, returning cached result")
                    return json.loads(cached_result)
                
                # Execute task
                result = func(*args, **kwargs)
                
                # Cache result
                redis_client.setex(cache_key, ttl, json.dumps(result, default=str))
                
                return result
            except Exception as e:
                logger.error(f"Idempotency check failed for {func.__name__}: {e}")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


class CostTracker:
    """Track and limit API costs"""
    
    def __init__(self, service_name: str, daily_limit: float = 100.0):
        self.service_name = service_name
        self.daily_limit = daily_limit
    
    def track_cost(self, cost: float) -> bool:
        """Track cost and return True if under limit"""
        if not redis_client:
            return True
        
        today = datetime.utcnow().strftime("%Y-%m-%d")
        key = f"cost_tracker:{self.service_name}:{today}"
        
        try:
            current_cost = float(redis_client.get(key) or 0)
            new_cost = current_cost + cost
            
            if new_cost > self.daily_limit:
                logger.error(
                    f"Daily cost limit exceeded for {self.service_name}: "
                    f"${new_cost:.2f} > ${self.daily_limit:.2f}"
                )
                return False
            
            # Update cost with 24 hour expiration
            redis_client.setex(key, 86400, new_cost)
            
            logger.info(
                f"Cost tracked for {self.service_name}: ${cost:.2f} "
                f"(Daily total: ${new_cost:.2f}/${self.daily_limit:.2f})"
            )
            
            return True
        except Exception as e:
            logger.error(f"Cost tracking error for {self.service_name}: {e}")
            return True  # Allow if error (fail open)


def cost_limited(service_name: str, cost_per_call: float, daily_limit: float = 100.0):
    """Decorator to add cost limiting to tasks"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            tracker = CostTracker(service_name, daily_limit)
            
            if not tracker.track_cost(cost_per_call):
                raise Exception(f"Daily cost limit exceeded for {service_name}")
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def log_task_execution(func: Callable) -> Callable:
    """Decorator to log task execution details"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        task_id = getattr(current_task, 'request', {}).get('id', 'unknown')
        
        logger.info(
            f"Task started: {func.__name__}",
            extra={
                "task_name": func.__name__,
                "task_id": task_id,
                "action": "start",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            logger.info(
                f"Task completed: {func.__name__} in {duration:.2f}s",
                extra={
                    "task_name": func.__name__,
                    "task_id": task_id,
                    "action": "complete",
                    "duration": duration,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            return result
        except Exception as exc:
            duration = time.time() - start_time
            
            logger.error(
                f"Task failed: {func.__name__} after {duration:.2f}s - {exc}",
                extra={
                    "task_name": func.__name__,
                    "task_id": task_id,
                    "action": "error",
                    "duration": duration,
                    "error": str(exc),
                    "timestamp": datetime.utcnow().isoformat()
                },
                exc_info=True
            )
            raise
    
    return wrapper


def is_market_hours() -> bool:
    """Check if it's currently market hours (9:30 AM - 4:00 PM ET, Mon-Fri)"""
    try:
        import pytz
        et = pytz.timezone('US/Eastern')
        now = datetime.now(et)
        
        # Check if it's a weekday
        if now.weekday() >= 5:  # Saturday = 5, Sunday = 6
            return False
        
        # Check time (9:30 AM - 4:00 PM ET)
        market_open = now.replace(hour=9, minute=30, second=0, microsecond=0)
        market_close = now.replace(hour=16, minute=0, second=0, microsecond=0)
        
        return market_open <= now <= market_close
        
    except Exception as e:
        logger.error(f"Error checking market hours: {e}")
        return True  # Default to True if we can't determine
