import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error caught by error handler:', error);

  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      ...(isDevelopment && { stack: error.stack }),
      timestamp: new Date().toISOString(),
    },
  });
}; 