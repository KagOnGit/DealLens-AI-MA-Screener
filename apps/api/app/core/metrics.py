"""
Optional Prometheus metrics for monitoring
Only enabled when METRICS_ENABLED=true in environment
"""
import time
import logging
from typing import Optional
from functools import wraps

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global metrics registry (None if metrics disabled)
metrics_registry = None
request_counter = None
request_duration = None
external_api_counter = None
external_api_duration = None

def init_metrics():
    """Initialize Prometheus metrics if enabled"""
    global metrics_registry, request_counter, request_duration, external_api_counter, external_api_duration
    
    metrics_enabled = getattr(settings, 'METRICS_ENABLED', False)
    
    if not metrics_enabled:
        logger.info("Metrics disabled - METRICS_ENABLED not set to true")
        return None
    
    try:
        from prometheus_client import Counter, Histogram, CollectorRegistry
        
        # Create custom registry
        metrics_registry = CollectorRegistry()
        
        # Request metrics
        request_counter = Counter(
            'http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status_code'],
            registry=metrics_registry
        )
        
        request_duration = Histogram(
            'http_request_duration_seconds',
            'HTTP request duration',
            ['method', 'endpoint'],
            registry=metrics_registry
        )
        
        # External API metrics
        external_api_counter = Counter(
            'external_api_requests_total',
            'Total external API requests',
            ['service', 'endpoint', 'status_code'],
            registry=metrics_registry
        )
        
        external_api_duration = Histogram(
            'external_api_request_duration_seconds',
            'External API request duration',
            ['service', 'endpoint'],
            registry=metrics_registry
        )
        
        logger.info("Prometheus metrics initialized")
        return metrics_registry
        
    except ImportError:
        logger.warning("Prometheus client not installed - metrics disabled")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize metrics: {e}")
        return None


def record_request_metrics(method: str, endpoint: str, status_code: int, duration: float):
    """Record HTTP request metrics"""
    if request_counter and request_duration:
        request_counter.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
        request_duration.labels(method=method, endpoint=endpoint).observe(duration)


def record_external_api_metrics(service: str, endpoint: str, status_code: int, duration: float):
    """Record external API metrics"""
    if external_api_counter and external_api_duration:
        external_api_counter.labels(service=service, endpoint=endpoint, status_code=status_code).inc()
        external_api_duration.labels(service=service, endpoint=endpoint).observe(duration)


def metrics_middleware(func):
    """Decorator to add metrics to API endpoints"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        if not metrics_registry:
            return await func(*args, **kwargs)
        
        start_time = time.time()
        
        try:
            response = await func(*args, **kwargs)
            status_code = getattr(response, 'status_code', 200)
            return response
        except Exception as e:
            status_code = getattr(e, 'status_code', 500)
            raise
        finally:
            duration = time.time() - start_time
            # TODO: Extract method and endpoint from request context
            record_request_metrics('GET', '/unknown', status_code, duration)
    
    return wrapper


def get_metrics_response():
    """Generate Prometheus metrics response"""
    if not metrics_registry:
        return "# Metrics disabled\n"
    
    try:
        from prometheus_client import generate_latest
        return generate_latest(metrics_registry)
    except ImportError:
        return "# Prometheus client not available\n"
    except Exception as e:
        logger.error(f"Error generating metrics: {e}")
        return f"# Error generating metrics: {e}\n"


# Initialize metrics on module import
init_metrics()
