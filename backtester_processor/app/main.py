"""
FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.exceptions import BacktesterException

app = FastAPI(
    title="Backtester API",
    description="Production-grade backtesting API for trading strategies",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(BacktesterException)
async def backtester_exception_handler(request: Request, exc: BacktesterException):
    """Global exception handler for backtester exceptions."""
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "error_code": exc.__class__.__name__},
    )


app.include_router(api_router, prefix="/api/v1")
