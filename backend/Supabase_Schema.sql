-- =========================================================================
-- BISHAL TRAVELS - Supabase PostgreSQL Database Schema
-- Fleet Management, Duty Slips, Corporate Clients & Monthly Invoices
-- =========================================================================

-- 1. Company Profile & Bank Details Table
CREATE TABLE IF NOT EXISTS company_profiles (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(200) NOT NULL DEFAULT 'BISHAL TRAVELS',
    tagline VARCHAR(250) DEFAULT 'Car Rental & Commercial Fleet Operations',
    trade_license_no VARCHAR(100) NOT NULL DEFAULT '1711',
    vendor_id VARCHAR(100) DEFAULT '10482',
    gstin VARCHAR(20) DEFAULT '',
    pan VARCHAR(20) NOT NULL DEFAULT 'BQNPP4333F',
    address VARCHAR(500) NOT NULL DEFAULT 'VILL - KALMIKHALI, P.O - ANDHARMANIK, P.S - BISHNUPUR, DIST - SOUTH 24 PARGANAS, PIN - 743503, STATE - WEST BENGAL',
    phone VARCHAR(50) NOT NULL DEFAULT '9088933712',
    email VARCHAR(100) NOT NULL DEFAULT 'bishaltravels.kolkata@gmail.com',
    bank_name VARCHAR(150) NOT NULL DEFAULT 'STATE BANK OF INDIA',
    account_holder VARCHAR(150) NOT NULL DEFAULT 'BISHAL TRAVELS',
    account_number VARCHAR(50) NOT NULL DEFAULT '44982066411',
    ifsc_code VARCHAR(20) NOT NULL DEFAULT 'SBIN0002117',
    branch_name VARCHAR(150) NOT NULL DEFAULT 'Bishnupur Branch, South 24 Parganas',
    upi_id VARCHAR(100) DEFAULT '9088933712@sbi',
    signatory_name VARCHAR(150) NOT NULL DEFAULT 'Biswajit Pramanik',
    signatory_title VARCHAR(100) NOT NULL DEFAULT 'Proprietor / Authorized Signatory',
    logo_url VARCHAR(500),
    default_terms TEXT[] DEFAULT ARRAY[
        'Payment must be cleared within 15 days from the date of invoice submission.',
        'Parking and toll charges are billed as per actuals.',
        'Night charges applicable for duties beyond normal operating hours.'
    ],
    is_configured BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Administrator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    reg_number VARCHAR(30) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Sedan',
    fuel_type VARCHAR(30) NOT NULL DEFAULT 'Diesel',
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(30) NOT NULL,
    default_daily_km NUMERIC(18,2) DEFAULT 100,
    default_daily_hours NUMERIC(18,2) DEFAULT 10,
    base_monthly_rate NUMERIC(18,2) NOT NULL DEFAULT 40000,
    rate_per_km NUMERIC(18,2) NOT NULL DEFAULT 18,
    rate_per_hour NUMERIC(18,2) NOT NULL DEFAULT 90,
    garage_rate_per_km NUMERIC(18,2) DEFAULT 0,
    night_charge_rate NUMERIC(18,2) NOT NULL DEFAULT 350,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    gstin VARCHAR(20) DEFAULT '',
    pan VARCHAR(20),
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    contract_ref_no VARCHAR(100) NOT NULL,
    contract_start_date VARCHAR(30),
    contract_end_date VARCHAR(30),
    payment_terms_days INT NOT NULL DEFAULT 30,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date VARCHAR(30) NOT NULL,
    due_date VARCHAR(30) NOT NULL,
    billing_month VARCHAR(50) NOT NULL,
    client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    client_snapshot_json TEXT NOT NULL DEFAULT '{}',
    contract_ref_no VARCHAR(100) DEFAULT '',
    attached_duty_slip_ids_json TEXT NOT NULL DEFAULT '[]',
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
    tax_type VARCHAR(30) NOT NULL DEFAULT 'GST_5',
    tax_rate NUMERIC(18,2) NOT NULL DEFAULT 5,
    cgst NUMERIC(18,2) NOT NULL DEFAULT 0,
    sgst NUMERIC(18,2) NOT NULL DEFAULT 0,
    igst NUMERIC(18,2) NOT NULL DEFAULT 0,
    is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
    discount NUMERIC(18,2) NOT NULL DEFAULT 0,
    advance_received NUMERIC(18,2) NOT NULL DEFAULT 0,
    tds_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
    tds_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(18,2) NOT NULL DEFAULT 0,
    net_payable NUMERIC(18,2) NOT NULL DEFAULT 0,
    amount_in_words VARCHAR(500) NOT NULL DEFAULT '',
    bank_details_json TEXT NOT NULL DEFAULT '{}',
    trade_license_no VARCHAR(100) DEFAULT '',
    company_gstin VARCHAR(50) DEFAULT '',
    company_pan VARCHAR(50) DEFAULT '',
    company_phone VARCHAR(50) DEFAULT '',
    company_email VARCHAR(100) DEFAULT '',
    company_address VARCHAR(500) DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    notes TEXT DEFAULT '',
    terms_json TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(300) NOT NULL,
    vehicle_reg_no VARCHAR(50),
    vehicle_model VARCHAR(100),
    billing_type VARCHAR(50) NOT NULL DEFAULT 'DutySlipAggregated',
    base_package_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_run_km NUMERIC(18,2) NOT NULL DEFAULT 0,
    rate_per_km NUMERIC(18,2) NOT NULL DEFAULT 0,
    km_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    extra_km NUMERIC(18,2) NOT NULL DEFAULT 0,
    extra_km_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
    extra_km_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    extra_hours NUMERIC(18,2) NOT NULL DEFAULT 0,
    extra_hour_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
    extra_hour_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    night_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    parking_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    toll_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    driver_allowance NUMERIC(18,2) NOT NULL DEFAULT 0,
    other_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    amount NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- 7. Duty Slips Table
CREATE TABLE IF NOT EXISTS duty_slips (
    id VARCHAR(50) PRIMARY KEY,
    duty_slip_no VARCHAR(50) UNIQUE NOT NULL,
    date VARCHAR(30) NOT NULL,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    route VARCHAR(200) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    start_km NUMERIC(18,2) NOT NULL DEFAULT 0,
    end_km NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_km NUMERIC(18,2) NOT NULL DEFAULT 0,
    garage_out_km NUMERIC(18,2),
    garage_in_km NUMERIC(18,2),
    garage_km NUMERIC(18,2),
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    total_hours NUMERIC(18,2) NOT NULL DEFAULT 0,
    extra_hours NUMERIC(18,2) NOT NULL DEFAULT 0,
    extra_duty VARCHAR(100),
    extra_duty_charges NUMERIC(18,2),
    night_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    parking_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    toll_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    driver_batta NUMERIC(18,2) NOT NULL DEFAULT 0,
    fuel_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
    other_expenses NUMERIC(18,2) NOT NULL DEFAULT 0,
    notes TEXT,
    invoice_id VARCHAR(50) REFERENCES invoices(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Performance Indexes
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_duty_slips_status ON duty_slips(status);
CREATE INDEX IF NOT EXISTS idx_duty_slips_client ON duty_slips(client_id);
CREATE INDEX IF NOT EXISTS idx_duty_slips_vehicle ON duty_slips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_duty_slips_invoice ON duty_slips(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(billing_month);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =========================================================================
-- Initial Seed Data
-- =========================================================================
INSERT INTO company_profiles (id, business_name, tagline, trade_license_no, vendor_id, pan, address, phone, email, bank_name, account_holder, account_number, ifsc_code, branch_name, upi_id, signatory_name, signatory_title, is_configured)
VALUES (
    1, 
    'BISHAL TRAVELS', 
    'Car Rental & Commercial Fleet Operations', 
    '1711', 
    '10482', 
    'BQNPP4333F', 
    'VILL - KALMIKHALI, P.O - ANDHARMANIK, P.S - BISHNUPUR, DIST - SOUTH 24 PARGANAS, PIN - 743503, STATE - WEST BENGAL', 
    '9088933712', 
    'bishaltravels.kolkata@gmail.com', 
    'STATE BANK OF INDIA', 
    'BISHAL TRAVELS', 
    '44982066411', 
    'SBIN0002117', 
    'Bishnupur Branch, South 24 Parganas', 
    '9088933712@sbi', 
    'Biswajit Pramanik', 
    'Proprietor / Authorized Signatory', 
    TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicles (id, reg_number, model, type, fuel_type, driver_name, driver_phone, default_daily_km, default_daily_hours, base_monthly_rate, rate_per_km, rate_per_hour, night_charge_rate, status, notes)
VALUES 
('veh-1', 'WB19R4841', 'Maruti Suzuki Swift Dzire (Commercial)', 'Sedan', 'Diesel', 'Ramesh Das', '9088933712', 100, 10, 40000, 18, 90, 350, 'Active', 'Primary monthly corporate vehicle'),
('veh-2', 'WB02AL4589', 'Toyota Innova Crysta', 'Innova Crysta', 'Diesel', 'Subhasish Roy', '9832044556', 120, 12, 65000, 24, 150, 500, 'Active', 'Outstation and VIP Duties'),
('veh-3', 'WB06H8821', 'Maruti Suzuki Ertiga', 'SUV', 'CNG', 'Anup Mondal', '9748033211', 100, 10, 45000, 16, 120, 400, 'Active', 'Monthly corporate duty')
ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, name, company_name, gstin, pan, address, phone, email, contract_ref_no, contract_start_date, payment_terms_days, notes)
VALUES 
('client-1', 'Logistics Manager', 'Eastern Infrastructure Projects Ltd.', '', '', 'Sector V, Salt Lake, Kolkata - 700091', '9830012345', 'billing@easterninfra.in', 'EIPL/TRAN/2026/044', '2026-07-01', 15, 'Monthly dedicated vehicle contract')
ON CONFLICT (id) DO NOTHING;
