/**
 * Macro System Service
 * Provides clinical text macros (hot buttons) for rapid SOAP documentation
 * Target: <100ms insertion time
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

// ============================================================================
// VARIABLE SUBSTITUTION PATTERNS
// ============================================================================

const VARIABLE_PATTERNS = {
    // Patient variables
    '{{patient.firstName}}': (ctx) => ctx.patient?.first_name || '',
    '{{patient.lastName}}': (ctx) => ctx.patient?.last_name || '',
    '{{patient.fullName}}': (ctx) => `${ctx.patient?.first_name || ''} ${ctx.patient?.last_name || ''}`.trim(),
    '{{patient.age}}': (ctx) => calculateAge(ctx.patient?.date_of_birth),
    '{{patient.gender}}': (ctx) => ctx.patient?.gender === 'M' ? 'han' : 'hun',
    '{{patient.pronoun}}': (ctx) => ctx.patient?.gender === 'M' ? 'Han' : 'Hun',

    // Date/Time variables
    '{{today}}': () => formatNorwegianDate(new Date()),
    '{{now}}': () => formatNorwegianTime(new Date()),
    '{{dayOfWeek}}': () => getNorwegianDayName(new Date()),

    // Provider variables
    '{{provider.name}}': (ctx) => ctx.provider?.name || 'Behandler',
    '{{provider.title}}': (ctx) => ctx.provider?.title || 'Kiropraktor',

    // Encounter variables
    '{{encounter.date}}': (ctx) => formatNorwegianDate(ctx.encounter?.encounter_date),
    '{{encounter.type}}': (ctx) => ctx.encounter?.encounter_type || 'konsultasjon',
    '{{encounter.visitNumber}}': (ctx) => ctx.visitNumber || 1,

    // Last encounter variables
    '{{lastVisit.date}}': (ctx) => formatNorwegianDate(ctx.lastEncounter?.encounter_date),
    '{{lastVisit.daysAgo}}': (ctx) => calculateDaysAgo(ctx.lastEncounter?.encounter_date),

    // Calculated variables
    '{{followUp.2weeks}}': () => formatNorwegianDate(addDays(new Date(), 14)),
    '{{followUp.1month}}': () => formatNorwegianDate(addDays(new Date(), 30)),
    '{{followUp.3months}}': () => formatNorwegianDate(addDays(new Date(), 90))
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateAge(birthDate) {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
}

function formatNorwegianDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatNorwegianTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

function getNorwegianDayName(date) {
    const days = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    return days[new Date(date).getDay()];
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function calculateDaysAgo(date) {
    if (!date) return '';
    const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'i dag';
    if (diff === 1) return 'i går';
    return `${diff} dager siden`;
}

// ============================================================================
// MACRO SERVICE CLASS
// ============================================================================

class MacroService {
    constructor() {
        this.cache = new Map(); // In-memory cache for fast access
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get all macros for an organization, organized by category
     * @param {string} organizationId - Organization UUID
     * @returns {Object} Macros organized by category
     */
    async getMacroMatrix(organizationId) {
        const startTime = Date.now();

        // Check cache first
        const cacheKey = `macros:${organizationId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            logger.debug('Macro cache hit', { organizationId, duration: Date.now() - startTime });
            return cached.data;
        }

        // Query database
        const result = await query(`
            SELECT
                id,
                category,
                subcategory,
                macro_name,
                macro_text,
                shortcut_key,
                soap_section,
                is_favorite,
                usage_count,
                display_order
            FROM clinical_macros
            WHERE organization_id = $1 AND is_active = true
            ORDER BY category, display_order, macro_name
        `, [organizationId]);

        // Organize by category
        const matrix = {};
        for (const row of result.rows) {
            if (!matrix[row.category]) {
                matrix[row.category] = {
                    name: row.category,
                    subcategories: {},
                    macros: []
                };
            }

            const macro = {
                id: row.id,
                name: row.macro_name,
                text: row.macro_text,
                shortcutKey: row.shortcut_key,
                soapSection: row.soap_section,
                isFavorite: row.is_favorite,
                usageCount: row.usage_count
            };

            if (row.subcategory) {
                if (!matrix[row.category].subcategories[row.subcategory]) {
                    matrix[row.category].subcategories[row.subcategory] = [];
                }
                matrix[row.category].subcategories[row.subcategory].push(macro);
            } else {
                matrix[row.category].macros.push(macro);
            }
        }

        // Cache result
        this.cache.set(cacheKey, { data: matrix, timestamp: Date.now() });

        const duration = Date.now() - startTime;
        logger.debug('Macro matrix loaded', { organizationId, duration, macroCount: result.rows.length });

        return matrix;
    }

    /**
     * Get favorite macros for quick access
     * @param {string} organizationId - Organization UUID
     * @param {string} userId - User UUID for personalized favorites
     * @returns {Array} Favorite macros
     */
    async getFavorites(organizationId, userId) {
        const result = await query(`
            SELECT
                m.id,
                m.category,
                m.macro_name,
                m.macro_text,
                m.shortcut_key,
                m.soap_section
            FROM clinical_macros m
            LEFT JOIN user_macro_favorites f ON m.id = f.macro_id AND f.user_id = $2
            WHERE m.organization_id = $1
              AND (m.is_favorite = true OR f.user_id IS NOT NULL)
              AND m.is_active = true
            ORDER BY COALESCE(f.display_order, m.display_order), m.macro_name
            LIMIT 20
        `, [organizationId, userId]);

        return result.rows;
    }

    /**
     * Expand macro text with variable substitution
     * Target: <100ms
     * @param {string} macroText - Raw macro text with variables
     * @param {Object} context - Context for variable substitution
     * @returns {string} Expanded text
     */
    expandMacro(macroText, context = {}) {
        const startTime = Date.now();

        let expanded = macroText;

        // Replace all known variables
        for (const [pattern, resolver] of Object.entries(VARIABLE_PATTERNS)) {
            if (expanded.includes(pattern)) {
                try {
                    expanded = expanded.replace(new RegExp(pattern.replace(/[{}]/g, '\\$&'), 'g'), resolver(context));
                } catch (error) {
                    logger.warn('Variable substitution failed', { pattern, error: error.message });
                }
            }
        }

        // Handle conditional blocks: {{#if condition}}text{{/if}}
        expanded = this.processConditionals(expanded, context);

        const duration = Date.now() - startTime;
        if (duration > 100) {
            logger.warn('Macro expansion exceeded 100ms target', { duration });
        }

        return expanded;
    }

    /**
     * Process conditional blocks in macro text
     */
    processConditionals(text, context) {
        // Simple conditional: {{#if patient.isNew}}...{{/if}}
        const conditionalPattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

        return text.replace(conditionalPattern, (match, condition, content) => {
            const conditionValue = this.evaluateCondition(condition, context);
            return conditionValue ? content : '';
        });
    }

    /**
     * Evaluate a simple condition
     */
    evaluateCondition(condition, context) {
        const parts = condition.split('.');
        let value = context;
        for (const part of parts) {
            value = value?.[part];
        }
        return Boolean(value);
    }

    /**
     * Record macro usage for analytics
     * @param {string} macroId - Macro UUID
     * @param {string} userId - User UUID
     */
    async recordUsage(macroId, userId) {
        try {
            await query(`
                UPDATE clinical_macros
                SET usage_count = usage_count + 1,
                    last_used_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [macroId]);

            // Also record user-specific usage for recommendations
            await query(`
                INSERT INTO macro_usage_log (macro_id, user_id, used_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
            `, [macroId, userId]);
        } catch (error) {
            // Don't fail the main operation if analytics fails
            logger.warn('Failed to record macro usage', { macroId, error: error.message });
        }
    }

    /**
     * Create a new macro
     */
    async createMacro(organizationId, macroData) {
        const result = await query(`
            INSERT INTO clinical_macros (
                organization_id,
                category,
                subcategory,
                macro_name,
                macro_text,
                shortcut_key,
                soap_section,
                created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            organizationId,
            macroData.category,
            macroData.subcategory,
            macroData.name,
            macroData.text,
            macroData.shortcutKey,
            macroData.soapSection,
            macroData.createdBy
        ]);

        // Invalidate cache
        this.cache.delete(`macros:${organizationId}`);

        return result.rows[0];
    }

    /**
     * Toggle favorite status
     */
    async toggleFavorite(macroId, userId) {
        const existing = await query(`
            SELECT 1 FROM user_macro_favorites
            WHERE macro_id = $1 AND user_id = $2
        `, [macroId, userId]);

        if (existing.rows.length > 0) {
            await query(`
                DELETE FROM user_macro_favorites
                WHERE macro_id = $1 AND user_id = $2
            `, [macroId, userId]);
            return { isFavorite: false };
        } else {
            await query(`
                INSERT INTO user_macro_favorites (macro_id, user_id)
                VALUES ($1, $2)
            `, [macroId, userId]);
            return { isFavorite: true };
        }
    }

    /**
     * Search macros by text
     */
    async searchMacros(organizationId, searchTerm) {
        const result = await query(`
            SELECT id, category, macro_name, macro_text, soap_section
            FROM clinical_macros
            WHERE organization_id = $1
              AND is_active = true
              AND (
                  macro_name ILIKE $2
                  OR macro_text ILIKE $2
                  OR category ILIKE $2
              )
            ORDER BY usage_count DESC
            LIMIT 10
        `, [organizationId, `%${searchTerm}%`]);

        return result.rows;
    }

    /**
     * Get recommended macros based on context
     */
    async getRecommendations(organizationId, context) {
        const { soapSection, bodyRegion, diagnosis } = context;

        const result = await query(`
            SELECT id, category, macro_name, macro_text
            FROM clinical_macros
            WHERE organization_id = $1
              AND is_active = true
              AND ($2::text IS NULL OR soap_section = $2)
              AND ($3::text IS NULL OR category ILIKE $3 OR macro_text ILIKE $3)
            ORDER BY usage_count DESC
            LIMIT 5
        `, [organizationId, soapSection, bodyRegion ? `%${bodyRegion}%` : null]);

        return result.rows;
    }
}

// Export singleton instance
export const macroService = new MacroService();

export default macroService;
