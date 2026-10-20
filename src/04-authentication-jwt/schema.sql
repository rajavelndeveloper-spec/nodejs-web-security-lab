CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS refresh_sessions (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id)
        ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    family_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_family
    ON refresh_sessions(family_id);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user
    ON refresh_sessions(user_id);
