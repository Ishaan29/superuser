import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  // Log request
  console.log(`${new Date().toISOString()} - ${method} ${url} - IP: ${ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${method} ${url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}; 