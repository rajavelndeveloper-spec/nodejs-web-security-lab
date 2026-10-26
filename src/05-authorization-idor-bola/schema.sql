CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id)
        ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_employees_user_id
    ON employees(user_id);