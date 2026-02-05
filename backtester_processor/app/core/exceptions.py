"""
Custom exceptions for the backtester application.
"""


class BacktesterException(Exception):
    """Base exception for backtester."""
    pass


class StrategyNotFoundError(BacktesterException):
    """Raised when requested strategy doesn't exist."""
    pass


class MarketNotFoundError(BacktesterException):
    """Raised when market/clob_token_id doesn't exist."""
    pass


class InsufficientDataError(BacktesterException):
    """Raised when there's not enough data to run backtest."""
    pass


class TopicNotFoundError(BacktesterException):
    """Raised when topic doesn't exist."""
    pass


class TopicNotContinuousError(BacktesterException):
    """Raised when trying to run continuous backtest on non-continuous topic."""
    pass
