/**
 * Winston Logger Configuration
 * Centralized logging for the application
 */

import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for development (human-readable)
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

// Determine format based on environment
const isProduction = process.env.NODE_ENV === 'production';

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isProduction ? json() : devFormat
  ),
  defaultMeta: { service: 'chiroclickcrm' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: isProduction ? combine(timestamp(), json()) : combine(colorize(), devFormat),
    }),
    // File output for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: combine(timestamp(), json()),
    }),
    // File output for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: combine(timestamp(), json()),
    }),
  ],
  exceptionHandlers: [new winston.transports.File({ filename: 'logs/exceptions.log' })],
  rejectionHandlers: [new winston.transports.File({ filename: 'logs/rejections.log' })],
});

// Create logs directory if it doesn't exist
import { mkdir } from 'fs/promises';
try {
  await mkdir('logs', { recursive: true });
} catch (error) {
  // Directory already exists or cannot be created
}

export default logger;
