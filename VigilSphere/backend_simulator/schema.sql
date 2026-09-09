create table if not exists security_logs (
    id          uuid primary key,
    timestamp   timestamptz not null default now(),
    source_ip   text not null,
    log_type    text not null check (log_type in ('ssh', 'nginx')),
    message     text not null,
    is_anomaly  boolean not null default false,
    mitre_tag   text
);

create index if not exists idx_security_logs_is_anomaly on security_logs (is_anomaly);
create index if not exists idx_security_logs_timestamp on security_logs (timestamp);
