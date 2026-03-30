/**
 * AI Retraining Service — Barrel
 *
 * Composes the AIRetrainingService class from domain-specific modules:
 *   - trainingPipeline.js  (orchestration, Modelfile, Ollama train/activate/rollback)
 *   - modelValidation.js   (validation, CLI testing, similarity)
 *   - dataCuration.js      (feedback export, prompt building)
 *   - retrainingMetrics.js  (DB recording, status, history)
 *
 * @module application/services/AIRetrainingService
 */

import { registerEventHandlers } from '../../domain/events/EventBus.js';
import { DOMAIN_EVENTS } from '../../domain/events/DomainEvents.js';
import { aiFeedbackService } from './AIFeedbackService.js';
import logger from '../../utils/logger.js';

// Domain modules
import {
  triggerRetraining,
  runRetrainingPipeline,
  rollbackModel,
  activateModel,
  getLastTrainingDate,
} from './trainingPipeline.js';
import {
  validateModel,
  testNewModel,
  calculateSimilarity,
  getCurrentModelInfo,
} from './modelValidation.js';
import {
  exportFeedbackToTrainingFormat,
  buildPromptFromContext,
  hashTrainingData,
} from './dataCuration.js';
import {
  recordTrainingRun,
  getLastTrainingRun,
  getTrainingHistory,
  getRetrainingStatus,
  getRetrainingHistory,
} from './retrainingMetrics.js';

class AIRetrainingService {
  constructor() {
    this.isRetraining = false;
    this.currentModelVersion = null;

    this.config = {
      minExamplesForRetraining: 100,
      acceptanceRateDropThreshold: 0.1,
      maxDaysBetweenTraining: 7,
      validationSplitRatio: 0.2,
      minValidationAccuracy: 0.75,
    };

    this._state = {
      get isRetraining() {
        return this._owner.isRetraining;
      },
      set isRetraining(v) {
        this._owner.isRetraining = v;
      },
      get currentModelVersion() {
        return this._owner.currentModelVersion;
      },
      set currentModelVersion(v) {
        this._owner.currentModelVersion = v;
      },
      get config() {
        return this._owner.config;
      },
    };
    this._state._owner = this;

    this.initEventHandlers();
    logger.info('AIRetrainingService initialized');
  }

  initEventHandlers() {
    registerEventHandlers({
      [DOMAIN_EVENTS.TRAINING_THRESHOLD_REACHED]: this.handleTrainingThresholdReached.bind(this),
    });
  }

  async handleTrainingThresholdReached(event) {
    const { stats } = event.payload;
    logger.info('Training threshold reached, evaluating retraining need', stats);
    try {
      const shouldRetrain = await this.evaluateRetrainingNeed(stats);
      if (shouldRetrain) {
        await this.triggerRetraining();
      }
    } catch (error) {
      logger.error('Error handling training threshold:', error);
    }
  }

  async evaluateRetrainingNeed(stats) {
    const currentMetrics = await aiFeedbackService.getMetrics(7);
    const previousMetrics = await aiFeedbackService.getMetrics(14);
    const currentRate = parseFloat(currentMetrics.acceptanceRate?.acceptanceRate || 0);
    const previousRate = parseFloat(previousMetrics.acceptanceRate?.acceptanceRate || currentRate);
    const rateDrop = previousRate - currentRate;
    const lastTraining = await getLastTrainingRun();
    const daysSinceTraining = lastTraining
      ? Math.floor(
          (Date.now() - new Date(lastTraining.completed_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      : Infinity;
    const reasons = [];
    if (stats.newExamples >= this.config.minExamplesForRetraining) {
      reasons.push(
        `New examples threshold (${stats.newExamples} >= ${this.config.minExamplesForRetraining})`
      );
    }
    if (rateDrop >= this.config.acceptanceRateDropThreshold * 100) {
      reasons.push(`Acceptance rate dropped by ${rateDrop.toFixed(2)}%`);
    }
    if (daysSinceTraining >= this.config.maxDaysBetweenTraining) {
      reasons.push(
        `Days since training (${daysSinceTraining} >= ${this.config.maxDaysBetweenTraining})`
      );
    }
    if (reasons.length > 0) {
      logger.info('Retraining needed:', { reasons });
      return true;
    }
    logger.debug('Retraining not needed at this time');
    return false;
  }

  // Delegated methods
  async triggerRetraining() {
    return triggerRetraining(this._state);
  }
  async exportTrainingData() {
    return (await import('./trainingPipeline.js')).exportTrainingData();
  }
  async createModelfile(td, v) {
    return (await import('./trainingPipeline.js')).createModelfile(td, v);
  }
  async trainModel(v, mf) {
    return (await import('./trainingPipeline.js')).trainModel(v, mf);
  }
  async validateModel(v) {
    return validateModel(v, this.config);
  }
  async getValidationExamples() {
    return (await import('./modelValidation.js')).getValidationExamples();
  }
  async activateModel(v) {
    this.currentModelVersion = v;
    return activateModel(v);
  }
  async rollbackModel(v) {
    return rollbackModel(v, this.currentModelVersion);
  }
  async recordTrainingRun(id, s, m) {
    return recordTrainingRun(id, s, m);
  }
  async getLastTrainingRun() {
    return getLastTrainingRun();
  }
  async getLastTrainingDate() {
    return getLastTrainingDate();
  }
  calculateSimilarity(a, b) {
    return calculateSimilarity(a, b);
  }
  hashTrainingData(d) {
    return hashTrainingData(d);
  }
  async getCurrentModelInfo() {
    return getCurrentModelInfo();
  }
  async getTrainingHistory(l) {
    return getTrainingHistory(l);
  }
  async getRetrainingStatus() {
    return getRetrainingStatus(this.isRetraining, this.currentModelVersion);
  }
  getStatus() {
    return { isRetraining: this.isRetraining, currentModelVersion: this.currentModelVersion };
  }
  async getRetrainingHistory(l) {
    return getRetrainingHistory(l);
  }
  getHistory(l = 5) {
    return this.getRetrainingHistory(l);
  }
  async exportFeedbackToTrainingFormat(o) {
    return exportFeedbackToTrainingFormat(o);
  }
  _buildPromptFromContext(t, c) {
    return buildPromptFromContext(t, c);
  }
  async testNewModel(m) {
    return testNewModel(m);
  }

  async runRetrainingPipeline(options = {}) {
    return runRetrainingPipeline(
      this._state,
      options,
      () => this.exportFeedbackToTrainingFormat(),
      (model) => this.testNewModel(model)
    );
  }

  async checkAndTriggerRetraining() {
    try {
      const status = await this.getRetrainingStatus();
      if (status.currentEvent?.status === 'running' || this.isRetraining) {
        logger.info('Retraining already in progress, skipping');
        return { triggered: false, reason: 'already_running' };
      }
      if (status.thresholds.thresholdReached) {
        logger.info('Retraining threshold reached, triggering pipeline');
        setImmediate(async () => {
          try {
            await this.runRetrainingPipeline({ trigger: 'automatic' });
          } catch (error) {
            logger.error('Automatic retraining failed:', error);
          }
        });
        return { triggered: true, reason: 'threshold_reached' };
      }
      return { triggered: false, reason: 'threshold_not_reached', status: status.thresholds };
    } catch (error) {
      logger.error('Error checking retraining threshold:', error);
      throw error;
    }
  }
}

export const aiRetrainingService = new AIRetrainingService();

export default aiRetrainingService;
