/**
 * Patient Domain Entity
 * Encapsulates business rules and validations for Patient
 */

export class Patient {
  constructor(data) {
    this.id = data.id;
    this.organizationId = data.organization_id;
    this.solvitId = data.solvit_id;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.dateOfBirth = data.date_of_birth;
    this.email = data.email;
    this.phone = data.phone;
    this.status = data.status || 'ACTIVE';
    this.category = data.category;
    this.totalVisits = data.total_visits || 0;
    this.lifetimeValue = data.lifetime_value || 0;
    this.shouldBeFollowedUp = data.should_be_followed_up;
    this.mainProblem = data.main_problem;
    this.preferredContactMethod = data.preferred_contact_method;
  }

  /**
   * Get full name
   */
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Check if patient is active
   */
  isActive() {
    return this.status === 'ACTIVE';
  }

  /**
   * Check if patient needs follow-up
   */
  needsFollowUp() {
    if (!this.shouldBeFollowedUp) return false;
    const followUpDate = new Date(this.shouldBeFollowedUp);
    const today = new Date();
    return followUpDate <= today;
  }

  /**
   * Check if patient is high value (business rule: >5000 NOK lifetime value)
   */
  isHighValue() {
    return this.lifetimeValue >= 5000;
  }

  /**
   * Check if patient is at risk of churning
   * Business rule: No visits in last 6 months
   */
  isAtRiskOfChurning(lastVisitDate) {
    if (!lastVisitDate) return true;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(lastVisitDate) < sixMonthsAgo;
  }

  /**
   * Determine recommended contact method
   */
  getRecommendedContactMethod() {
    if (this.preferredContactMethod) {
      return this.preferredContactMethod;
    }
    // Default business rule: prefer SMS for patients with phone
    if (this.phone) return 'SMS';
    if (this.email) return 'EMAIL';
    return 'PHONE';
  }

  /**
   * Calculate age
   */
  getAge() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Validate business rules before saving
   */
  validate() {
    const errors = [];

    if (!this.firstName || this.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!this.dateOfBirth) {
      errors.push('Date of birth is required');
    }

    if (!this.solvitId) {
      errors.push('SolvIT ID is required');
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED'];
    if (!validStatuses.includes(this.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to database format
   */
  toDatabase() {
    return {
      id: this.id,
      organization_id: this.organizationId,
      solvit_id: this.solvitId,
      first_name: this.firstName,
      last_name: this.lastName,
      date_of_birth: this.dateOfBirth,
      email: this.email,
      phone: this.phone,
      status: this.status,
      category: this.category,
      total_visits: this.totalVisits,
      lifetime_value: this.lifetimeValue,
      should_be_followed_up: this.shouldBeFollowedUp,
      main_problem: this.mainProblem,
      preferred_contact_method: this.preferredContactMethod
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    return new Patient(row);
  }
}

export default Patient;
