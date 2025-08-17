import time
import logging
from typing import Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from collections import defaultdict, deque

logger = logging.getLogger(__name__)


class SimpleRateLimiter:
    """Simple in-memory rate limiter using token bucket algorithm"""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients: Dict[str, deque] = defaultdict(deque)
    
    def is_allowed(self, client_id: str) -> Tuple[bool, int]:
        """Check if request is allowed and return remaining requests"""
        now = time.time()
        window_start = now - self.window_seconds
        
        # Clean old requests
        client_requests = self.clients[client_id]
        while client_requests and client_requests[0] < window_start:
            client_requests.popleft()
        
        # Check if we're under the limit
        if len(client_requests) < self.max_requests:
            client_requests.append(now)
            remaining = self.max_requests - len(client_requests)
            return True, remaining
        
        return False, 0


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for API endpoints"""
    
    def __init__(
        self,
        app,
        max_requests: int = 100,
        window_seconds: int = 60,
        auth_max_requests: int = 10  # More restrictive for auth endpoints
    ):
        super().__init__(app)
        self.general_limiter = SimpleRateLimiter(max_requests, window_seconds)
        self.auth_limiter = SimpleRateLimiter(auth_max_requests, window_seconds)
    
    def get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Use X-Forwarded-For header if available (for proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Fall back to direct client IP
        return request.client.host if request.client else "unknown"
    
    def is_auth_endpoint(self, path: str) -> bool:
        """Check if the path is an authentication endpoint"""
        auth_paths = ["/auth/", "/login", "/register", "/token"]
        return any(auth_path in path for auth_path in auth_paths)
    
    async def dispatch(self, request: Request, call_next):
        client_id = self.get_client_id(request)
        path = str(request.url.path)
        
        # Choose appropriate rate limiter
        limiter = self.auth_limiter if self.is_auth_endpoint(path) else self.general_limiter
        
        # Check rate limit
        allowed, remaining = limiter.is_allowed(client_id)
        
        if not allowed:
            logger.warning(f"Rate limit exceeded for client {client_id} on path {path}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": limiter.window_seconds
                },
                headers={
                    "X-RateLimit-Limit": str(limiter.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + limiter.window_seconds)),
                    "Retry-After": str(limiter.window_seconds)
                }
            )
        
        # Process request
        response: Response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(limiter.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + limiter.window_seconds))
        
        return response
