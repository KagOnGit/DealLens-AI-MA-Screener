import logging
import logging.config
import sys
import json
from datetime import datetime
from typing import Any, Dict

from app.core.config import settings
from app.middleware.request_id import get_request_id, RequestIDFilter


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        # Create the log entry
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add request ID if available
        request_id = get_request_id()
        if request_id:
            log_entry["request_id"] = request_id
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add any extra fields
        extra_fields = {}
        for key, value in record.__dict__.items():
            if key not in [
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                'thread', 'threadName', 'processName', 'process', 'message',
                'request_id'
            ] and not key.startswith('_'):
                extra_fields[key] = value
        
        if extra_fields:
            log_entry["extra"] = extra_fields
        
        return json.dumps(log_entry, default=str)


def setup_logging() -> None:
    """Configure logging for the application"""
    
    # Determine log level
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Create JSON formatter
    json_formatter = JSONFormatter()
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Create console handler with JSON formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(json_formatter)
    console_handler.addFilter(RequestIDFilter())
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    loggers_config = {
        "uvicorn": {"level": log_level},
        "uvicorn.access": {"level": logging.WARNING if settings.ENVIRONMENT == "production" else log_level},
        "uvicorn.error": {"level": log_level},
        "fastapi": {"level": log_level},
        "sqlalchemy": {"level": logging.WARNING},  # Reduce SQL query noise
        "sqlalchemy.engine": {"level": logging.WARNING},
        "celery": {"level": log_level},
        "redis": {"level": logging.WARNING},
    }
    
    for logger_name, config in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(config["level"])
        logger.propagate = True  # Let root handler handle the output
    
    # Log startup message
    logger = logging.getLogger(__name__)
    logger.info(
        f"Logging configured - Level: {settings.LOG_LEVEL}, Environment: {settings.ENVIRONMENT}",
        extra={
            "component": "logging",
            "action": "setup_complete",
            "log_level": settings.LOG_LEVEL,
            "environment": settings.ENVIRONMENT
        }
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name"""
    return logging.getLogger(name)


# Structured logging helpers
def log_api_request(
    logger: logging.Logger, 
    method: str, 
    path: str, 
    status_code: int, 
    duration_ms: float,
    **kwargs
) -> None:
    """Log API request in structured format"""
    logger.info(
        f"{method} {path} {status_code} {duration_ms:.2f}ms",
        extra={
            "component": "api",
            "action": "request",
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": duration_ms,
            **kwargs
        }
    )


def log_external_api_call(
    logger: logging.Logger,
    service: str,
    endpoint: str,
    status_code: int,
    duration_ms: float,
    success: bool,
    **kwargs
) -> None:
    """Log external API calls in structured format"""
    level = logging.INFO if success else logging.WARNING
    logger.log(
        level,
        f"External API call to {service} {endpoint} - {status_code} {duration_ms:.2f}ms",
        extra={
            "component": "external_api",
            "action": "call",
            "service": service,
            "endpoint": endpoint,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "success": success,
            **kwargs
        }
    )


def log_business_event(
    logger: logging.Logger,
    event: str,
    entity_type: str,
    entity_id: str,
    **kwargs
) -> None:
    """Log business events in structured format"""
    logger.info(
        f"Business event: {event} for {entity_type}:{entity_id}",
        extra={
            "component": "business",
            "action": "event",
            "event": event,
            "entity_type": entity_type,
            "entity_id": entity_id,
            **kwargs
        }
    )
