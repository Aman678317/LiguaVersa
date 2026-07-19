# Disaster Recovery Plan

## Objectives
- **Recovery Point Objective (RPO)**: 1 Hour (Maximum acceptable data loss)
- **Recovery Time Objective (RTO)**: 4 Hours (Maximum acceptable downtime)

## Backup Strategy
- **PostgreSQL Database**: Supabase handles automated Point-In-Time Recovery (PITR). Manual logical backups via `pg_dump` are scheduled every hour via cron to S3.
- **Application Config**: Environment configurations (`.env`) are securely managed in AWS Secrets Manager / GitHub Secrets.

## Recovery Procedures

### Scenario 1: Database Corruption / Data Loss
1. Identify the point of corruption.
2. In Supabase Dashboard, select **Database > Backups**.
3. Choose the last known good PITR snapshot.
4. Execute restoration. (Est. time: 15 mins).
5. Verify data integrity.

### Scenario 2: Complete Infrastructure Loss (Region Failure)
1. Update DNS records (Cloudflare) to point to the failover region.
2. Provision new PostgreSQL cluster via Supabase in the backup region.
3. Restore latest `pg_dump` from S3.
4. Deploy the infrastructure using CI/CD Pipeline to the failover region.
5. Monitor `/health` endpoints and adjust load balancer rules.

## Post-Recovery Validation
- Verify admin dashboard shows active sockets.
- Conduct a test video call with translations.
- Review error logs (`logs/error.log`) for any lingering integration failures.
