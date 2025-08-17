import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from contextvars import ContextVar

# Context variable to store request ID across the request lifecycle
request_id_var: ContextVar[str] = ContextVar("request_id", default="")

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add unique request IDs to each request for tracing"""
    
    def __init__(self, app, header_name: str = "X-Request-ID"):
        super().__init__(app)
        self.header_name = header_name
    
    async def dispatch(self, request: Request, call_next):
        # Get request ID from header or generate new one
        request_id = request.headers.get(self.header_name) or str(uuid.uuid4())
        
        # Set in context var for access in other parts of the application
        request_id_var.set(request_id)
        
        # Add to request state for easy access
        request.state.request_id = request_id
        
        # Process the request
        response: Response = await call_next(request)
        
        # Add request ID to response headers
        response.headers[self.header_name] = request_id
        
        return response


def get_request_id() -> str:
    """Get the current request ID from context"""
    return request_id_var.get()


# Configure logging to include request ID
class RequestIDFilter(logging.Filter):
    """Logging filter to add request ID to log records"""
    
    def filter(self, record):
        record.request_id = get_request_id()
        return True
