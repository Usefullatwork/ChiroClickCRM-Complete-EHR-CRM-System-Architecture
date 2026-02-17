/**
 * CRM Leads Service
 * Lead CRUD, pipeline stats, and lead-to-patient conversion
 */

import { query } from '../../config/database.js';

/**
 * Get leads with filters and pagination
 */
export const getLeads = async (clinicId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    source,
    assignedTo,
    temperature,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  const offset = (page - 1) * limit;
  const params = [clinicId];
  let paramCount = 1;

  let whereClause = 'WHERE l.organization_id = $1';

  if (status) {
    paramCount++;
    whereClause += ` AND l.status = $${paramCount}`;
    params.push(status);
  }

  if (source) {
    paramCount++;
    whereClause += ` AND l.source = $${paramCount}`;
    params.push(source);
  }

  if (assignedTo) {
    paramCount++;
    whereClause += ` AND l.assigned_to = $${paramCount}`;
    params.push(assignedTo);
  }

  if (temperature) {
    paramCount++;
    whereClause += ` AND l.temperature = $${paramCount}`;
    params.push(temperature);
  }

  if (search) {
    paramCount++;
    whereClause += ` AND (l.first_name ILIKE $${paramCount} OR l.last_name ILIKE $${paramCount} OR l.email ILIKE $${paramCount} OR l.phone ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  const validSortColumns = [
    'created_at',
    'first_name',
    'last_name',
    'score',
    'status',
    'next_follow_up_date',
  ];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countResult = await query(`SELECT COUNT(*) as total FROM leads l ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].total);

  // Get leads
  params.push(limit, offset);
  const result = await query(
    `SELECT l.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
     FROM leads l
     LEFT JOIN users u ON l.assigned_to = u.id
     ${whereClause}
     ORDER BY ${sortColumn} ${order}
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    params
  );

  return {
    leads: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get lead by ID
 */
export const getLeadById = async (clinicId, leadId) => {
  const result = await query(
    `SELECT l.*,
            u.first_name as assigned_first_name, u.last_name as assigned_last_name,
            p.id as converted_patient_id, p.first_name as converted_patient_first_name
     FROM leads l
     LEFT JOIN users u ON l.assigned_to = u.id
     LEFT JOIN patients p ON l.converted_patient_id = p.id
     WHERE l.organization_id = $1 AND l.id = $2`,
    [clinicId, leadId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Get activities
  const activities = await query(
    `SELECT la.*, u.first_name, u.last_name
     FROM lead_activities la
     LEFT JOIN users u ON la.user_id = u.id
     WHERE la.lead_id = $1
     ORDER BY la.created_at DESC
     LIMIT 50`,
    [leadId]
  );

  return {
    ...result.rows[0],
    activities: activities.rows,
  };
};

/**
 * Create lead
 */
export const createLead = async (data) => {
  const {
    organization_id,
    first_name,
    last_name,
    email,
    phone,
    source,
    source_detail,
    primary_interest,
    chief_complaint,
    notes,
    assigned_to,
  } = data;

  const result = await query(
    `INSERT INTO leads (
      organization_id, first_name, last_name, email, phone, source, source_detail,
      primary_interest, chief_complaint, notes, assigned_to, temperature
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'WARM')
    RETURNING *`,
    [
      organization_id,
      first_name,
      last_name,
      email,
      phone,
      source,
      source_detail,
      primary_interest,
      chief_complaint,
      notes,
      assigned_to,
    ]
  );

  // Log activity
  await query(
    `INSERT INTO lead_activities (lead_id, activity_type, description)
     VALUES ($1, 'CREATED', 'Lead opprettet')`,
    [result.rows[0].id]
  );

  return result.rows[0];
};

/**
 * Update lead
 */
export const updateLead = async (clinicId, leadId, data) => {
  const fields = [];
  const values = [clinicId, leadId];
  let paramCount = 2;

  const allowedFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'status',
    'score',
    'temperature',
    'assigned_to',
    'primary_interest',
    'chief_complaint',
    'notes',
    'next_follow_up_date',
    'lost_reason',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return null;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');

  const result = await query(
    `UPDATE leads SET ${fields.join(', ')}
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Convert lead to patient
 */
export const convertLeadToPatient = async (clinicId, leadId, _patientData) => {
  const lead = await getLeadById(clinicId, leadId);
  if (!lead) {
    throw new Error('Lead not found');
  }

  // Create patient from lead data
  const patientResult = await query(
    `INSERT INTO patients (
      organization_id, first_name, last_name, email, phone,
      acquisition_source, lifecycle_stage, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'NEW', 'ACTIVE')
    RETURNING *`,
    [clinicId, lead.first_name, lead.last_name, lead.email, lead.phone, lead.source]
  );

  const patient = patientResult.rows[0];

  // Update lead status
  await query(
    `UPDATE leads SET
      status = 'CONVERTED',
      converted_patient_id = $1,
      converted_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [patient.id, leadId]
  );

  // Log activity
  await query(
    `INSERT INTO lead_activities (lead_id, activity_type, description, new_value)
     VALUES ($1, 'CONVERTED', 'Lead konvertert til pasient', $2)`,
    [leadId, patient.id]
  );

  return { lead, patient };
};

/**
 * Get lead pipeline stats
 */
export const getLeadPipelineStats = async (clinicId) => {
  const result = await query(
    `SELECT
      status,
      COUNT(*) as count,
      AVG(score) as avg_score
     FROM leads
     WHERE organization_id = $1
     GROUP BY status
     ORDER BY
       CASE status
         WHEN 'NEW' THEN 1
         WHEN 'CONTACTED' THEN 2
         WHEN 'QUALIFIED' THEN 3
         WHEN 'APPOINTMENT_BOOKED' THEN 4
         WHEN 'SHOWED' THEN 5
         WHEN 'CONVERTED' THEN 6
         WHEN 'LOST' THEN 7
         WHEN 'NURTURING' THEN 8
       END`,
    [clinicId]
  );

  // Calculate conversion rate
  const totalResult = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'CONVERTED') as converted,
      COUNT(*) as total
     FROM leads WHERE organization_id = $1`,
    [clinicId]
  );

  const { converted, total } = totalResult.rows[0];

  return {
    stages: result.rows,
    conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : 0,
    totalLeads: parseInt(total),
  };
};
