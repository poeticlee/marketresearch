-- Phase 1: PostgreSQL schema (bible Section 7)
create table if not exists users(id text primary key, name text not null, email text unique not null, password_hash text not null, organisation text, country text not null, verified boolean default false, plan text default 'free', terms_version text, terms_accepted_at timestamptz);
create table if not exists projects(id text primary key, owner_id text references users(id), title text not null, purpose text not null, target_countries text[] not null, created_at timestamptz default now());
create table if not exists briefs(id text primary key, project_id text references projects(id), raw_text text, validated_text text, status text, rejection_reason text, created_at timestamptz default now());
create table if not exists records(id text primary key, project_id text references projects(id), entity_type text, name text, role text, phones text[], emails text[], address text, country text, category text, self_declared_tags text[], source_id text, source_url text, collected_at timestamptz, confidence float, status text default 'candidate', retention_until timestamptz);
create table if not exists sources(id text primary key, country text, name text, type text, access_method text, terms_notes text, allowed_use text, quality_rating float, enabled boolean default true);
create table if not exists rule_profiles(id text primary key, jurisdiction text, version text, rules jsonb, reviewed_by text, reviewed_at timestamptz);
create table if not exists suppression_entries(hash text primary key, type text, date timestamptz default now(), reason text);
create table if not exists export_logs(id text primary key, user_id text, project_id text, record_count int, jurisdictions text[], purpose text, created_at timestamptz default now());
create table if not exists audit_logs(id text primary key, actor text, action text, object text, created_at timestamptz default now());
create table if not exists dsr_requests(id text primary key, type text, contact text, detail text, status text default 'open', sla_due timestamptz, created_at timestamptz default now());
