/**
 * Database Mock for Testing
 */

export const query = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
export const transaction = jest.fn().mockImplementation(async (callback) => {
  const client = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
  return await callback(client);
});
export const getClient = jest.fn();
export const healthCheck = jest.fn().mockResolvedValue(true);
export const closePool = jest.fn();

export default {
  query,
  transaction,
  getClient,
  healthCheck,
  closePool,
};
