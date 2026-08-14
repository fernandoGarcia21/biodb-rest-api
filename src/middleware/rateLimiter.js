/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2026-01-19
 * Rate limiting middleware configuration
 */

import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';

// Key generator function to use session ID instead of IP
const sessionKeyGenerator = (req) => {
  // Use session ID if available, otherwise fall back to properly handled IP
  const key = req.session?.id || ipKeyGenerator(req);
  console.log('Rate limiter key:', key);
  return key;
};

// General API rate limiter - 500 requests per 15 minutes per session
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each session to 500 requests per windowMs
  message: 'Too many requests from this session, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: sessionKeyGenerator,
});

// Strict rate limiter for authentication endpoints - 10 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each session to 10 login attempts per windowMs
  message: 'Too many login attempts from this session, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count successful attempts as well
  keyGenerator: sessionKeyGenerator,
});

// Moderate rate limiter for data submission - 20 requests per 15 minutes
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each session to 20 create operations per windowMs
  message: 'Too many creation requests from this session, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: sessionKeyGenerator,
});

// Lenient rate limiter for read operations - 200 requests per 15 minutes
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each session to 200 read requests per windowMs
  message: 'Too many requests from this session, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: sessionKeyGenerator,
});
