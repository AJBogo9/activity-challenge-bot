-- Users/Participants table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  guild VARCHAR(100),  -- No foreign key constraint, validated in application
  points DECIMAL(10,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Activities/Exercises table
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(255) NOT NULL,
  duration INTEGER,  -- in minutes
  points DECIMAL(10,2) NOT NULL,  -- MET-hours (decimal values)
  description TEXT,
  activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL  -- When the activity was logged
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  ease_of_use INTEGER CHECK (ease_of_use >= 1 AND ease_of_use <= 5),
  usefulness INTEGER CHECK (usefulness >= 1 AND usefulness <= 5),
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  text_feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed BOOLEAN DEFAULT FALSE
);

-- Guilds table (seeded from src/config/guilds.ts on startup)
CREATE TABLE IF NOT EXISTS guilds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  total_members INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Historical Snapshots for Performance
CREATE TABLE IF NOT EXISTS user_daily_snapshots (
  date DATE NOT NULL,
  telegram_id VARCHAR(50) NOT NULL,
  points DECIMAL(10,2) NOT NULL,
  rank INTEGER NOT NULL,
  PRIMARY KEY (date, telegram_id)
);

CREATE TABLE IF NOT EXISTS guild_daily_snapshots (
  date DATE NOT NULL,
  guild_name VARCHAR(100) NOT NULL,
  points DECIMAL(15,2) NOT NULL,
  rank INTEGER NOT NULL,
  PRIMARY KEY (date, guild_name)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_guild ON users(guild) WHERE guild IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_points_desc ON users(points DESC);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, activity_date);

-- Snapshot indexes
CREATE INDEX IF NOT EXISTS idx_user_snapshots_date ON user_daily_snapshots(date);
CREATE INDEX IF NOT EXISTS idx_guild_snapshots_date ON guild_daily_snapshots(date);

-- Indexes for feedback table
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewed ON feedback(reviewed);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Prevent duplicate activity submissions (same activity within same minute)
-- This prevents accidental double-clicks but allows logging same activity type multiple times per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_activity ON activities(
  user_id, 
  activity_type, 
  activity_date, 
  duration, 
  points
);