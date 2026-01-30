/**
 * Migration: Billing System
 * Adds invoices, invoice items, and takst codes for Danish healthcare billing
 */

export const up = async (client) => {
  await client.query(`
    -- Create takst codes table first (referenced by invoice items)
    CREATE TABLE IF NOT EXISTS takst_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(20) UNIQUE,
      description TEXT,
      price DECIMAL(10,2),
      category VARCHAR(100),
      is_active BOOLEAN DEFAULT true
    );

    -- Indexes for takst codes
    CREATE INDEX IF NOT EXISTS idx_takst_codes_code
    ON takst_codes(code);

    CREATE INDEX IF NOT EXISTS idx_takst_codes_category
    ON takst_codes(category);

    CREATE INDEX IF NOT EXISTS idx_takst_codes_active
    ON takst_codes(is_active) WHERE is_active = true;

    -- Create invoices table
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
      provider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      invoice_number VARCHAR(50) UNIQUE,
      appointment_id INTEGER,
      total_amount DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'draft',
      due_date DATE,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),

      CONSTRAINT valid_invoice_status CHECK (
        status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')
      )
    );

    -- Indexes for invoices
    CREATE INDEX IF NOT EXISTS idx_invoices_patient
    ON invoices(patient_id);

    CREATE INDEX IF NOT EXISTS idx_invoices_provider
    ON invoices(provider_id);

    CREATE INDEX IF NOT EXISTS idx_invoices_number
    ON invoices(invoice_number);

    CREATE INDEX IF NOT EXISTS idx_invoices_status
    ON invoices(status);

    CREATE INDEX IF NOT EXISTS idx_invoices_appointment
    ON invoices(appointment_id) WHERE appointment_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_invoices_due_date
    ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled', 'refunded');

    CREATE INDEX IF NOT EXISTS idx_invoices_created
    ON invoices(created_at DESC);

    -- Composite index for overdue invoice queries
    CREATE INDEX IF NOT EXISTS idx_invoices_overdue
    ON invoices(status, due_date)
    WHERE status IN ('sent', 'overdue');

    -- Create invoice items table
    CREATE TABLE IF NOT EXISTS invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
      takst_code VARCHAR(20),
      description TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10,2),
      total_price DECIMAL(10,2)
    );

    -- Indexes for invoice items
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice
    ON invoice_items(invoice_id);

    CREATE INDEX IF NOT EXISTS idx_invoice_items_takst_code
    ON invoice_items(takst_code);

    -- Add foreign key constraint to invoices for appointment_id if appointments table exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'appointments'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'invoices_appointment_id_fkey'
      ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT invoices_appointment_id_fkey
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;
      END IF;
    END $$;

    -- Create function for invoice number generation
    CREATE OR REPLACE FUNCTION generate_invoice_number()
    RETURNS TRIGGER AS $$
    DECLARE
      year_prefix VARCHAR(4);
      next_number INTEGER;
    BEGIN
      IF NEW.invoice_number IS NULL THEN
        year_prefix := TO_CHAR(NOW(), 'YYYY');
        SELECT COALESCE(MAX(
          CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)
        ), 0) + 1
        INTO next_number
        FROM invoices
        WHERE invoice_number LIKE year_prefix || '-%';

        NEW.invoice_number := year_prefix || '-' || LPAD(next_number::TEXT, 6, '0');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;
    CREATE TRIGGER generate_invoice_number_trigger
      BEFORE INSERT ON invoices
      FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

    -- Create function to calculate invoice total
    CREATE OR REPLACE FUNCTION update_invoice_total()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE invoices
      SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM invoice_items
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      )
      WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_invoice_total_trigger ON invoice_items;
    CREATE TRIGGER update_invoice_total_trigger
      AFTER INSERT OR UPDATE OR DELETE ON invoice_items
      FOR EACH ROW EXECUTE FUNCTION update_invoice_total();

    -- Comments for documentation
    COMMENT ON TABLE takst_codes IS 'Danish healthcare billing codes (takster)';
    COMMENT ON TABLE invoices IS 'Patient invoices for services rendered';
    COMMENT ON TABLE invoice_items IS 'Line items within an invoice';
    COMMENT ON COLUMN invoices.status IS 'draft, sent, paid, overdue, cancelled, refunded';
    COMMENT ON COLUMN invoices.invoice_number IS 'Auto-generated format: YYYY-NNNNNN';
  `);
};

export const down = async (client) => {
  await client.query(`
    -- Drop triggers and functions
    DROP TRIGGER IF EXISTS update_invoice_total_trigger ON invoice_items;
    DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;
    DROP FUNCTION IF EXISTS update_invoice_total();
    DROP FUNCTION IF EXISTS generate_invoice_number();

    -- Remove foreign key constraint
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'invoices_appointment_id_fkey'
      ) THEN
        ALTER TABLE invoices
        DROP CONSTRAINT invoices_appointment_id_fkey;
      END IF;
    END $$;

    -- Drop tables in reverse order
    DROP TABLE IF EXISTS invoice_items;
    DROP TABLE IF EXISTS invoices;
    DROP TABLE IF EXISTS takst_codes;
  `);
};
