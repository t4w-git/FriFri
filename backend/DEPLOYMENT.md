# Deployment & Rollout Plan

## Environment Strategy

### Development
- Local development with docker-compose
- Hot reload with `npm run dev`
- All features enabled for testing

### Staging
- Staging environment mirrors production
- Database restore from production (redacted)
- Full testing before production release

### Production
- High availability setup with load balancing
- Auto-scaling capability
- Database replication and backups
- CDN for static assets

## Deployment Architecture

```
                        ┌─────────────────┐
                        │   Clients       │
                        │  (Browsers/     │
                        │   Mobile)       │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    │            │            │
         ┌──────────▼──┐ ┌───────▼────┐ ┌────▼───────┐
         │ Load        │ │ Load      │ │ Load       │
         │ Balancer    │ │ Balancer  │ │ Balancer   │
         │ (Primary)   │ │(Secondary)│ │ (Tertiary) │
         └──────────┬──┘ └───────┬────┘ └────┬───────┘
                    │            │            │
         ┌──────────┼────────────┼────────────┼──────────┐
         │          │            │            │          │
    ┌────▼──┐  ┌───▼────┐  ┌───▼────┐  ┌───▼────┐ ┌───▼────┐
    │Backend│  │Backend │  │Backend │  │Backend │ │Backend │
    │  Pod  │  │  Pod   │  │  Pod   │  │  Pod   │ │  Pod   │
    │  1    │  │  2     │  │  3     │  │  4     │ │  5     │
    └────┬──┘  └────┬───┘  └────┬───┘  └────┬───┘ └────┬───┘
         │          │           │           │          │
         └──────────┼───────────┼───────────┼──────────┘
                    │           │           │
         ┌──────────┼───────────┼───────────┼──────────┐
         │          │           │           │          │
    ┌────▼──────────▼─────┐     │      ┌────▼──────────▼─────┐
    │   Primary DB        │     │      │  Read Replica 1     │
    │  (PostgreSQL)       │     │      │  (PostgreSQL)       │
    │  - Write            │     │      │  - Read only        │
    │  - Replication      │     │      │  - Backup target    │
    └─────────────────────┘     │      └─────────────────────┘
                                │
                          ┌─────▼────────┐
                          │  Redis Cache │
                          │ (Sentinel)   │
                          └──────────────┘
```

## Deployment Methods

### 1. Docker Compose (Development/Staging)

```bash
docker-compose up -d
```

### 2. Kubernetes (Production)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frifri-backend
  namespace: production
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: frifri-backend
  template:
    metadata:
      labels:
        app: frifri-backend
    spec:
      containers:
      - name: frifri-backend
        image: frifri-backend:latest
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 3. Cloud Platforms

#### AWS ECS
- Container Registry: ECR
- Load Balancer: ALB
- Database: RDS PostgreSQL
- Cache: ElastiCache Redis
- Monitoring: CloudWatch + Sentry

#### Google Cloud Run
- Container Registry: Artifact Registry
- Load Balancer: Cloud Load Balancing
- Database: Cloud SQL
- Cache: Memorystore
- Monitoring: Cloud Monitoring + Sentry

#### Azure Container Instances
- Registry: Azure Container Registry
- Load Balancer: Azure Load Balancer
- Database: Azure Database for PostgreSQL
- Cache: Azure Cache for Redis
- Monitoring: Azure Monitor + Sentry

## Blue-Green Deployment Strategy

```
Current (Blue)          New (Green)
┌──────────────┐       ┌──────────────┐
│ v1.0.0       │       │ v1.0.1       │
│ 5 Replicas   │       │ 5 Replicas   │
│ Active       │       │ Warming up   │
│ (100% traffic)       │ (Testing)    │
└──────────────┘       └──────────────┘
         │                     │
         │  After validation   │
         └─────────┬───────────┘
                   │
              Switch traffic
                   │
        ┌──────────▼──────────┐
        │      Green          │
        │ v1.0.1 Active       │
        │ (100% traffic)      │
        └─────────────────────┘
```

### Steps
1. Deploy new version to Green environment
2. Run smoke tests against Green
3. Gradually shift traffic (canary: 10% → 50% → 100%)
4. Monitor metrics during shift
5. If issues: rollback to Blue
6. If successful: keep Green as primary, reuse Blue for next release

## Canary Deployment

```
Initial:
├─ v1.0.0: 95%
└─ v1.0.1: 5%    (100 users)

After 30 min:
├─ v1.0.0: 80%
└─ v1.0.1: 20%   (400 users)

After 1 hour:
├─ v1.0.0: 50%
└─ v1.0.1: 50%   (1000 users)

After 2 hours:
└─ v1.0.1: 100%  (2000 users)
```

### Rollback Triggers
- Error rate > 1%
- Response time > 500ms (p95)
- Health check failures > 10%
- Exception rate spike > 50%

## Database Migrations

### Pre-deployment
```bash
npm run migrate
# Verify no schema conflicts
```

### Schema-less Changes
- Add new columns (non-required)
- Add new tables
- Add new indexes
- Delete unused columns (v+2 after deprecation)

### Breaking Changes
- Require major version bump
- Deprecation period: 2 releases minimum
- Announce in changelog

### Rollback Strategy
```bash
# If migration fails in production
npm run migrate:down
git revert <commit>
docker-compose down
docker-compose up -d
```

## Monitoring During Deployment

### Key Metrics
- Response time (p95, p99)
- Error rate (5xx, 4xx)
- Throughput (requests/sec)
- Database query time
- Cache hit rate
- Queue depth (if using message queue)

### Alerting Thresholds
- Error rate > 1%: Warning
- Error rate > 5%: Critical
- Response time p95 > 500ms: Warning
- Response time p95 > 1000ms: Critical
- Health check failures: Immediate rollback

### Sentry Integration
```javascript
// Automatically captured on deploy
Sentry.captureMessage('Deployment: v1.0.1 to production', 'info');
```

## Rollback Procedure

### Automatic Rollback
```bash
# Triggered by monitoring alerts
if (errorRate > 5% || responseTime > 1000ms) {
  docker-compose down
  git checkout v1.0.0
  docker-compose up -d
  notify('Automatic rollback to v1.0.0 due to errors');
}
```

### Manual Rollback
```bash
# Step 1: Identify previous version
git log --oneline | head -5

# Step 2: Checkout previous version
git checkout v1.0.0

# Step 3: Stop current deployment
docker-compose down

# Step 4: Start previous version
docker-compose up -d

# Step 5: Verify health
curl http://localhost:3000/health

# Step 6: Notify team
notify('Manual rollback to v1.0.0 completed by ops');
```

## Zero-Downtime Deployment

1. **Traffic Shift**
   - Load balancer routes to both versions
   - New requests → v1.0.1
   - Existing connections → v1.0.0

2. **Connection Draining**
   - Max 60 seconds to drain connections
   - New connections immediately to v1.0.1
   - Old connections complete on v1.0.0

3. **Health Checks**
   - v1.0.1 only receives traffic after 3 successful health checks
   - Spaced 5 seconds apart
   - Total: ~15 seconds before full traffic

## Post-Deployment Checklist

- [ ] Health check endpoints responding
- [ ] Error rate < 0.5%
- [ ] Response times normal
- [ ] Database migration successful
- [ ] All services in cluster healthy
- [ ] Sentry showing no unexpected errors
- [ ] New features working as expected
- [ ] Load balancer distribution correct
- [ ] Cache warming complete
- [ ] Stakeholders notified

## Disaster Recovery

### Database Backup
```bash
# Automatic daily backups
# Retention: 30 days
# Recovery Time Objective (RTO): 1 hour
# Recovery Point Objective (RPO): 1 hour

pg_dump frifri_db | gzip > /backups/frifri_$(date +%Y%m%d).sql.gz
# Upload to S3/cloud storage
```

### Data Restoration
```bash
# From latest backup
gunzip < /backups/frifri_latest.sql.gz | psql frifri_db
npm run migrate
npm run seed # Restore initial data if needed
```

### Incident Response
1. Identify issue in Sentry/monitoring
2. Create incident in war room
3. Determine RTO/RPO impact
4. Execute rollback if needed
5. Restore from backup if necessary
6. Test thoroughly before re-deploying
7. Post-mortem within 24 hours

## Deployment Timeline Example

```
16:00 - Start deployment (low traffic period)
16:05 - Build and test Docker image
16:10 - Deploy to staging
16:15 - Run smoke tests
16:20 - Deploy to production (blue)
16:25 - Start canary (5% traffic)
16:35 - Canary 20% (monitoring)
16:45 - Canary 50% (monitoring)
16:55 - Full traffic to green
17:00 - Monitor for 30 min
17:30 - Deployment successful
```

## Team Responsibilities

- **DevOps**: Infrastructure, deployment, scaling
- **Backend Team**: Code quality, testing, documentation
- **QA**: Staging validation, smoke tests
- **Platform Owner**: Deployment approval, rollback decision
- **On-call**: Monitor production, respond to alerts
