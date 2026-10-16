CREATE TABLE IF NOT EXISTS demo_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

INSERT INTO demo_users (username, password)
VALUES
    ('admin', 'demo-admin-password'),
    ('alice', 'demo-alice-password')
ON CONFLICT (username) DO NOTHING;