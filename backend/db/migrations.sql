CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    uploaded_filename TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    parsed_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workshops (
    id INTEGER PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES templates(id),
    org_name TEXT,
    workshop_name TEXT NOT NULL,
    status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    sheet_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    domain_id INTEGER REFERENCES domains(id),
    role_name TEXT NOT NULL,
    role_key TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    domain_id INTEGER NOT NULL REFERENCES domains(id),
    activity_text TEXT NOT NULL,
    section_text TEXT,
    order_index INTEGER DEFAULT 0,
    in_scope_bool BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    domain_id INTEGER NOT NULL REFERENCES domains(id),
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    role_id INTEGER NOT NULL REFERENCES roles(id),
    raci_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    domain_id INTEGER NOT NULL REFERENCES domains(id),
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    domain_id INTEGER NOT NULL REFERENCES domains(id),
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    issue_type TEXT NOT NULL,
    severity TEXT,
    status TEXT,
    owner_role_id INTEGER REFERENCES roles(id),
    due_date TEXT
);

CREATE TABLE IF NOT EXISTS exports (
    id INTEGER PRIMARY KEY,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    export_type TEXT NOT NULL,
    filepath TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
