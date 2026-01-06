# Database Schema

Complete documentation of the PostgreSQL database schema, design decisions, and query patterns.

## Schema Overview

The database consists of three main tables with a simple, normalized structure:

```
users (User accounts and points)
  ↓ one-to-many
activities (Activity logs)

users
  ↓ one-to-many
feedback (User feedback)
```

## Table Definitions

### users

Stores user profiles and aggregate point totals.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  guild VARCHAR(100),
  points DECIMAL(10,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Columns:**
- `id`: Internal primary key (auto-incrementing)
- `telegram_id`: Unique Telegram user identifier (string to handle large numbers)
- `username`: Telegram username (nullable, not all users have one)
- `first_name`: User's first name from Telegram profile
- `last_name`: User's last name (nullable)
- `guild`: Guild affiliation (validated at application layer)
- `points`: Total accumulated points (sum of all activities)
- `created_at`: Registration timestamp

**Indexes:**
```sql
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_guild ON users(guild) WHERE guild IS NOT NULL;
CREATE INDEX idx_users_points ON users(points DESC);
```

**Design Decisions:**
- `telegram_id` is VARCHAR(50) not INTEGER to handle Telegram's large user IDs safely
- `guild` has no foreign key constraint for deployment flexibility
- `points` uses DECIMAL(10,2) for precision (no floating-point errors)
- Partial index on `guild` (only for non-null values) for efficiency

### activities

Stores individual activity logs with date and point details.

```sql
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(255) NOT NULL,
  duration INTEGER,
  points DECIMAL(10,2) NOT NULL,
  description TEXT,
  activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Columns:**
- `id`: Internal primary key
- `user_id`: Foreign key to users (cascading delete)
- `activity_type`: Full hierarchy path (e.g., "Sports > Basketball > Playing basketball, game > competitive")
- `duration`: Activity duration in minutes (nullable for future flexibility)
- `points`: Calculated MET-hours for this activity
- `description`: Optional user notes (currently unused)
- `activity_date`: When the activity was performed
- `created_at`: When the activity was logged (for audit trail)

**Indexes:**
```sql
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_date ON activities(activity_date);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_user_date ON activities(user_id, activity_date);
```

**Unique Constraint:**
```sql
CREATE UNIQUE INDEX idx_unique_activity ON activities(
  user_id, 
  activity_type, 
  activity_date, 
  duration, 
  points
);
```

**Design Decisions:**
- `activity_date` separate from `created_at` to support retroactive logging
- `activity_type` stored as string (full path) for flexibility
- Unique constraint prevents accidental double-submissions
- `CASCADE DELETE` ensures orphaned activities are removed if user deleted

### feedback

Stores user feedback for bot improvement.

```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  ease_of_use INTEGER CHECK (ease_of_use >= 1 AND ease_of_use <= 5),
  usefulness INTEGER CHECK (usefulness >= 1 AND usefulness <= 5),
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  text_feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed BOOLEAN DEFAULT FALSE
);
```

**Columns:**
- `id`: Internal primary key
- `user_id`: Foreign key to users
- `ease_of_use`: 1-5 star rating
- `usefulness`: 1-5 star rating
- `overall_satisfaction`: 1-5 star rating
- `text_feedback`: Free-form feedback text
- `created_at`: When feedback was submitted
- `reviewed`: Admin flag for tracking processed feedback

**Indexes:**
```sql
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_reviewed ON feedback(reviewed);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

## Key Design Patterns

### 1. Denormalized Points

Points are stored in two places:

```sql
-- Aggregate total in users table
SELECT points FROM users WHERE telegram_id = '123456789';

-- Individual activity points
SELECT points FROM activities WHERE user_id = 42;
```

**Why?**
- Fast rankings: `SELECT * FROM users ORDER BY points DESC` doesn't need JOINs
- Data verification: Can compare `SUM(activities.points)` with `users.points`
- Historical analysis: Can see point accumulation over time

**Trade-offs:**
- Must update both tables when logging activities
- Slight redundancy (but minimal storage cost)
- Need to keep them in sync (handled in application code)

### 2. String-Based Activity Type

Instead of foreign keys to activity tables:

```sql
activity_type: "Sports > Basketball > Playing basketball, game > competitive"
```

**Why?**
- No database migrations when activity hierarchy changes
- Easy to search: `WHERE activity_type LIKE '%Basketball%'`
- Human-readable in queries and exports
- Flexible for custom activities in future

**Trade-offs:**
- Slightly more storage (but text is cheap)
- Can't enforce referential integrity at DB level
- Harder to query "all basketball activities" (but still possible with LIKE)

### 3. No Foreign Key for Guilds

Guild names are validated in application code, not database constraints.

**Why?**
- Can add/remove guilds without database migrations
- Simpler deployment (no schema changes needed)
- Guild list is in code (version controlled, type-safe)

**Trade-offs:**
- Must validate guild names in application layer
- Can't use foreign key constraints
- Possible data inconsistency if validation fails (but unlikely)

### 4. Separate Activity Date and Creation Date

```sql
activity_date DATE          -- When activity was performed
created_at TIMESTAMP        -- When activity was logged
```

**Why?**
- Users can log past activities ("I forgot to log yesterday's run")
- Can track logging delays (analytics)
- Audit trail (know when data was entered)

**Example:**
```
activity_date: 2026-01-10    (activity happened)
created_at: 2026-01-12       (logged 2 days later)
```

## Common Queries

### User Lookup

```sql
-- By Telegram ID (most common)
SELECT * FROM users WHERE telegram_id = $1;

-- By guild
SELECT * FROM users WHERE guild = $1;
```

### Rankings

```sql
-- Global leaderboard
SELECT 
  telegram_id,
  username,
  first_name,
  points,
  guild,
  RANK() OVER (ORDER BY points DESC) as rank
FROM users
ORDER BY points DESC
LIMIT 20;

-- Guild leaderboard
SELECT 
  telegram_id,
  username,
  first_name,
  points,
  RANK() OVER (PARTITION BY guild ORDER BY points DESC) as guild_rank
FROM users
WHERE guild = $1
ORDER BY points DESC;
```

### User Statistics

```sql
-- User summary with rankings
WITH global_stats AS (
  SELECT 
    telegram_id,
    RANK() OVER (ORDER BY points DESC) as global_rank,
    COUNT(*) OVER () as total_users
  FROM users
),
guild_stats AS (
  SELECT 
    telegram_id,
    RANK() OVER (PARTITION BY guild ORDER BY points DESC) as guild_rank,
    COUNT(*) OVER (PARTITION BY guild) as guild_users
  FROM users
  WHERE guild IS NOT NULL
)
SELECT 
  u.points,
  u.first_name,
  u.username,
  u.guild,
  gs.global_rank,
  gs.total_users,
  gus.guild_rank,
  gus.guild_users
FROM users u
LEFT JOIN global_stats gs ON u.telegram_id = gs.telegram_id
LEFT JOIN guild_stats gus ON u.telegram_id = gus.telegram_id
WHERE u.telegram_id = $1;
```

### Activity History

```sql
-- User's recent activities
SELECT 
  activity_type,
  duration,
  points,
  activity_date,
  created_at
FROM activities
WHERE user_id = $1
ORDER BY activity_date DESC, created_at DESC
LIMIT 50;

-- Activities by date range
SELECT * FROM activities
WHERE user_id = $1 
  AND activity_date BETWEEN $2 AND $3
ORDER BY activity_date DESC;
```

### Guild Statistics

```sql
-- Guild leaderboard with participation
SELECT 
  guild,
  COUNT(id) as total_members,
  COUNT(id) FILTER (WHERE points > 0) as active_members,
  COALESCE(SUM(points), 0) as total_points,
  COALESCE(AVG(points), 0) as avg_points
FROM users
WHERE guild IS NOT NULL
GROUP BY guild
ORDER BY avg_points DESC;
```

### Ranking History

```sql
-- Daily ranking progression for a user
WITH RECURSIVE dates AS (
  SELECT CURRENT_DATE - INTERVAL '30 days' as date
  UNION ALL
  SELECT date + INTERVAL '1 day'
  FROM dates
  WHERE date < CURRENT_DATE
),
daily_points AS (
  SELECT 
    u.telegram_id,
    d.date::DATE,
    SUM(COALESCE(a.points, 0)) as points
  FROM users u
  CROSS JOIN dates d
  LEFT JOIN activities a ON u.id = a.user_id AND a.activity_date <= d.date
  GROUP BY u.telegram_id, d.date
),
daily_ranks AS (
  SELECT 
    telegram_id,
    date,
    points,
    RANK() OVER (PARTITION BY date ORDER BY points DESC) as rank
  FROM daily_points
)
SELECT date, rank, points
FROM daily_ranks
WHERE telegram_id = $1
ORDER BY date ASC;
```

## Database Operations

### Creating a User

```typescript
import { sql } from './connection'

export async function createUser(userData: {
  telegramId: string
  username: string
  firstName: string
  lastName: string
  guild: string
}) {
  const [user] = await sql`
    INSERT INTO users (telegram_id, username, first_name, last_name, guild, points)
    VALUES (${userData.telegramId}, ${userData.username}, ${userData.firstName}, 
            ${userData.lastName}, ${userData.guild}, 0)
    RETURNING *
  `
  return user
}
```

### Logging an Activity

```typescript
export async function createActivity(activityData: {
  userId: number
  activityType: string
  duration: number
  points: number
  activityDate: Date
  description?: string
}) {
  // Insert activity
  const [activity] = await sql`
    INSERT INTO activities (user_id, activity_type, duration, points, activity_date, description)
    VALUES (${activityData.userId}, ${activityData.activityType}, ${activityData.duration},
            ${activityData.points}, ${activityData.activityDate}, ${activityData.description})
    RETURNING *
  `
  
  // Update user's total points
  await sql`
    UPDATE users 
    SET points = points + ${activityData.points}
    WHERE id = ${activityData.userId}
  `
  
  return activity
}
```

### Deleting a User

```typescript
export async function deleteUser(telegramId: string) {
  // CASCADE DELETE will automatically remove activities and feedback
  await sql`
    DELETE FROM users WHERE telegram_id = ${telegramId}
  `
}
```

## Performance Considerations

### Index Strategy

Indexes are created for common query patterns:

1. **Primary Lookups**: `telegram_id`, `user_id`
2. **Sorting**: `points DESC`, `created_at DESC`, `activity_date`
3. **Filtering**: `guild` (partial index for non-null values)
4. **Composite**: `(user_id, activity_date)` for activity history queries

### Query Optimization

**Use Window Functions** for rankings instead of subqueries:
```sql
-- Fast
RANK() OVER (ORDER BY points DESC)

-- Slow
(SELECT COUNT(*) FROM users u2 WHERE u2.points > u1.points) + 1
```

**Use LIMIT** for leaderboards:
```sql
-- Only fetch what's needed
SELECT * FROM users ORDER BY points DESC LIMIT 20;
```

**Use Partial Indexes** for filtered queries:
```sql
-- Index only non-null guilds
CREATE INDEX idx_users_guild ON users(guild) WHERE guild IS NOT NULL;
```

### Connection Pooling

The application uses `postgres.js` with connection pooling:

```typescript
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,                    // Max connections in pool
  idle_timeout: 20,          // Close idle connections after 20s
  connect_timeout: 10        // Connection timeout
})
```

## Migrations

### Initial Schema

**File:** `src/db/schema.sql`

Contains the complete schema with all tables, indexes, and constraints.

### Running Migrations

```bash
# Via migration script
bun src/db/migrate.ts

# Or manually
psql -U postgres -d activity_challenge -f src/db/schema.sql
```

### Migration Strategy

Currently using **schema-first** migrations:
1. Update `schema.sql` with new structure
2. Run migration script
3. Script uses `CREATE IF NOT EXISTS` for idempotency

For production, consider:
- Version-controlled migration files (e.g., `001_initial.sql`, `002_add_feedback.sql`)
- Migration tools like `node-pg-migrate` or `db-migrate`
- Rollback scripts for each migration

## Backup & Restore

### Backup

```bash
# Full database backup
pg_dump -U postgres activity_challenge > backup.sql

# Data only (no schema)
pg_dump -U postgres --data-only activity_challenge > data.sql

# Specific table
pg_dump -U postgres -t users activity_challenge > users_backup.sql
```

### Restore

```bash
# From full backup
psql -U postgres -d activity_challenge < backup.sql

# From data only
psql -U postgres -d activity_challenge < data.sql
```

### Automated Backups

For production, set up automated backups:
```bash
# Cron job example (daily backup at 2 AM)
0 2 * * * pg_dump -U postgres activity_challenge | gzip > /backups/activity_challenge_$(date +\%Y\%m\%d).sql.gz
```

## Data Integrity

### Constraints

**Primary Keys**: All tables have auto-incrementing primary keys

**Unique Constraints**: 
- `users.telegram_id` (one account per Telegram user)
- `activities(user_id, activity_type, activity_date, duration, points)` (prevent duplicates)

**Foreign Keys**:
- `activities.user_id` → `users.id` (CASCADE DELETE)
- `feedback.user_id` → `users.id` (CASCADE DELETE)

**Check Constraints**:
- Feedback ratings between 1-5
- (Could add: points >= 0, duration > 0)

### Validation

Application-level validation ensures:
- Guild names exist in configuration
- Activity types exist in hierarchy
- Dates within competition period
- Duration is positive and reasonable

### Data Consistency Checks

```sql
-- Verify points match activity sum
SELECT 
  u.id,
  u.points as user_points,
  COALESCE(SUM(a.points), 0) as calculated_points,
  u.points - COALESCE(SUM(a.points), 0) as difference
FROM users u
LEFT JOIN activities a ON u.id = a.user_id
GROUP BY u.id, u.points
HAVING ABS(u.points - COALESCE(SUM(a.points), 0)) > 0.01;
```

## Scaling Considerations

### Current Scale
- Target: 1000-2000 users (Aalto University guilds)
- Activity rate: ~50-100 activities/day
- Database size: <1 GB

### If Scaling Beyond
1. **Read Replicas**: For stats queries and leaderboards
2. **Partitioning**: Partition activities by date (yearly/quarterly)
3. **Caching**: Redis for leaderboards and user rankings
4. **Archiving**: Move old competition data to archive tables
5. **Sharding**: Partition by guild if multiple universities

Currently, PostgreSQL on a single server handles the load easily.

## Security

### SQL Injection Prevention

All queries use parameterized statements:

```typescript
// Safe
await sql`SELECT * FROM users WHERE telegram_id = ${userInput}`

// Never do this
await sql`SELECT * FROM users WHERE telegram_id = '${userInput}'`
```

### Access Control

Database access controlled through:
- Connection string (in environment variable)
- Network restrictions (firewall/VPC)
- Limited user privileges (not using `postgres` superuser in production)

### Data Privacy

Minimal data stored:
- No email addresses
- No phone numbers  
- No location data
- No health metrics (just activities and points)

Users can request data deletion (GDPR compliance).

## Monitoring

### Useful Queries

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('activity_challenge'));

-- Table sizes
SELECT 
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Slow queries (if query logging enabled)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Health Checks

```typescript
// Simple connection check
export async function checkDatabaseHealth() {
  try {
    await sql`SELECT 1`
    return { healthy: true }
  } catch (error) {
    return { healthy: false, error: error.message }
  }
}
```

## Future Enhancements

Potential schema additions:
1. **Achievements Table**: Track milestone achievements
2. **Teams Table**: Group users into sub-teams within guilds
3. **Challenges Table**: Special limited-time events
4. **Activity Photos**: Store verification photos
5. **User Settings**: Preferences and notification settings
6. **Audit Log**: Track all data changes for compliance