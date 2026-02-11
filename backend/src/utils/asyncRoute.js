/**
 * Async Route Wrapper
 * Catches errors from async route handlers and forwards to global error handler
 */
export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncRoute;
