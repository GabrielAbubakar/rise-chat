/**
 * Custom Error class to standardize error handling across the application.
 * All API errors are mapped to this class, ensuring consistent properties.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly isNetworkError: boolean;

  constructor(message: string, code = 'UNKNOWN_ERROR', statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    
    // If there is no HTTP status code (or it's a known network level code like 0/503), it's highly likely a network error
    this.isNetworkError = !statusCode || statusCode === 0 || statusCode >= 500;
    
    // Required to fix prototype chain when targeting older ES versions or using certain bundlers
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
