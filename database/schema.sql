CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'employee')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE businesses (
    business_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    pay_period VARCHAR(50) DEFAULT 'monthly',
    public_holiday_region VARCHAR(10) DEFAULT 'NZ',
    annual_leave_entitlement INTEGER DEFAULT 4
);

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
    role VARCHAR(100),
    contract_type VARCHAR(20) CHECK (contract_type IN ('full time', 'part time', 'casual')),
    hourly_rate DECIMAL(10, 2),
    start_date DATE,
    tax_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE rosters (
    roster_id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    template_name VARCHAR(255)
);

CREATE TABLE shifts (
    shift_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    roster_id INTEGER REFERENCES rosters(roster_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hours_worked DECIMAL(5, 2),
    is_published BOOLEAN DEFAULT FALSE
);

CREATE TABLE shift_swap_requests (
    swap_request_id SERIAL PRIMARY KEY,
    requesting_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    target_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    original_shift_id INTEGER REFERENCES shifts(shift_id) ON DELETE CASCADE,
    target_shift_id INTEGER REFERENCES shifts(shift_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payruns (
    payrun_id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    total_gross_pay DECIMAL(12, 2),
    is_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE payslips (
    payslip_id SERIAL PRIMARY KEY,
    payrun_id INTEGER REFERENCES payruns(payrun_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    hours_worked DECIMAL(5, 2),
    base_pay DECIMAL(10, 2),
    holiday_pay DECIMAL(10, 2),
    overtime_pay DECIMAL(10, 2),
    tax_deduction DECIMAL(10, 2),
    net_pay DECIMAL(10, 2),
    pdf_url VARCHAR(500)
);

CREATE TABLE leave_requests (
    leave_request_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    leave_type VARCHAR(20) CHECK (leave_type IN ('annual', 'sick', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_balances (
    balance_id SERIAL PRIMARY KEY,
    employee_id INTEGER UNIQUE REFERENCES employees(employee_id) ON DELETE CASCADE,
    annual_leave_remaining DECIMAL(5, 2) DEFAULT 20,
    sick_leave_remaining DECIMAL(5, 2) DEFAULT 10,
    holiday_pay_accrued DECIMAL(10, 2) DEFAULT 0
);

CREATE TABLE sales_data (
    data_id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    revenue DECIMAL(12, 2) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(20) CHECK (source IN ('csv', 'excel', 'manual'))
);

CREATE TABLE forecasts (
    forecast_id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    forecast_start DATE NOT NULL,
    forecast_end DATE NOT NULL,
    predicted_revenue DECIMAL(12, 2),
    confidence_interval_upper DECIMAL(12, 2),
    confidence_interval_lower DECIMAL(12, 2)
);

CREATE TABLE analytics_queries (
    query_id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    sql_generated TEXT,
    result_data JSONB,
    queried_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);