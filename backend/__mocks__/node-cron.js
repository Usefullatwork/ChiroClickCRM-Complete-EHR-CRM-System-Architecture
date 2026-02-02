/**
 * Mock for node-cron
 * Makes tests independent of the scheduler
 */

const schedule = jest.fn().mockReturnValue({
  start: jest.fn(),
  stop: jest.fn()
});

const validate = jest.fn().mockReturnValue(true);

const getTasks = jest.fn().mockReturnValue(new Map());

export default { schedule, validate, getTasks };
export { schedule, validate, getTasks };
