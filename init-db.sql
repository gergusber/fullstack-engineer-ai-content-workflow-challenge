-- Initialize the ai_content_workflow database
-- This script runs when PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE ai_content_workflow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_content_workflow')\gexec

-- Connect to the database
\c ai_content_workflow;

-- Create a dedicated user for the application with the same credentials as in compose.yml
-- User: postgres, Password: password (from POSTGRES_USER and POSTGRES_PASSWORD)
-- Note: The postgres user is already created by the container, but we ensure it has proper permissions
GRANT ALL PRIVILEGES ON DATABASE ai_content_workflow TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
