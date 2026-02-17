/**
 * Automation Conditions
 * Condition operators and evaluation logic
 */

import logger from '../../utils/logger.js';

// =============================================================================
// CONDITION OPERATORS
// =============================================================================

export const OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  IN: 'in',
  NOT_IN: 'not_in',
};

/**
 * Evaluate workflow conditions against patient data
 */
export const evaluateConditions = (workflow, patient) => {
  const conditions = workflow.conditions || [];

  if (conditions.length === 0) {
    return true;
  }

  // Group conditions by logic (AND/OR)
  // Default to AND logic if not specified
  const groupedConditions = groupConditionsByLogic(conditions);

  return evaluateConditionGroup(groupedConditions, patient);
};

/**
 * Group conditions by their logic operator
 */
const groupConditionsByLogic = (conditions) =>
  // Simple implementation: treat all as AND unless explicitly marked
  ({
    logic: 'AND',
    conditions: conditions,
  });
/**
 * Evaluate a group of conditions
 */
const evaluateConditionGroup = (group, patient) => {
  const { logic, conditions } = group;

  if (logic === 'OR') {
    return conditions.some((condition) => evaluateSingleCondition(condition, patient));
  }

  // Default: AND logic
  return conditions.every((condition) => evaluateSingleCondition(condition, patient));
};

/**
 * Evaluate a single condition
 */
const evaluateSingleCondition = (condition, patient) => {
  const { field, operator, value } = condition;
  const patientValue = getNestedValue(patient, field);

  switch (operator) {
    case OPERATORS.EQUALS:
      // eslint-disable-next-line eqeqeq
      return patientValue == value;

    case OPERATORS.NOT_EQUALS:
      // eslint-disable-next-line eqeqeq
      return patientValue != value;

    case OPERATORS.GREATER_THAN:
      return Number(patientValue) > Number(value);

    case OPERATORS.LESS_THAN:
      return Number(patientValue) < Number(value);

    case OPERATORS.CONTAINS:
      if (Array.isArray(patientValue)) {
        return patientValue.includes(value);
      }
      return String(patientValue).toLowerCase().includes(String(value).toLowerCase());

    case OPERATORS.NOT_CONTAINS:
      if (Array.isArray(patientValue)) {
        return !patientValue.includes(value);
      }
      return !String(patientValue).toLowerCase().includes(String(value).toLowerCase());

    case OPERATORS.IS_EMPTY:
      return (
        patientValue === null ||
        patientValue === undefined ||
        patientValue === '' ||
        (Array.isArray(patientValue) && patientValue.length === 0)
      );

    case OPERATORS.IS_NOT_EMPTY:
      return (
        patientValue !== null &&
        patientValue !== undefined &&
        patientValue !== '' &&
        (!Array.isArray(patientValue) || patientValue.length > 0)
      );

    case OPERATORS.IN: {
      const valueList = Array.isArray(value) ? value : [value];
      return valueList.includes(patientValue);
    }

    case OPERATORS.NOT_IN: {
      const excludeList = Array.isArray(value) ? value : [value];
      return !excludeList.includes(patientValue);
    }

    default:
      logger.warn('Unknown condition operator:', operator);
      return true;
  }
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj, path) => {
  if (!obj || !path) {
    return undefined;
  }

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
};
