# Features

A comprehensive overview of the Activity Challenge Bot's capabilities.

## Core Features

### Guild Competition System

The bot facilitates friendly competition between Aalto University guilds through a sophisticated ranking system.

**Key Characteristics:**
- Guilds compete based on **average points per member**, not total points
- Ensures fair competition regardless of guild size
- Tracks both active participation rate and point accumulation
- Real-time leaderboard updates with intelligent caching (5-minute TTL)

**Guild Statistics Tracked:**
- Total points accumulated by all members
- Number of active members (members with points > 0)
- Number of registered members
- Total guild membership (from configuration)
- Participation percentage (active/total members)
- Average points per member (ranking metric)

### Activity Logging

Users log activities through an intuitive multi-step wizard that guides them through the selection process.

**4-Level Hierarchy:**
1. **Main Category**: Broad activity types (e.g., "Sports", "Transportation", "Home Activities")
2. **Subcategory**: More specific groupings (e.g., "Running", "Cycling", "Walking")
3. **Activity**: Specific activity (e.g., "Running, jogging", "Bicycling, mountain")
4. **Intensity**: Effort level (e.g., "general", "moderate", "vigorous")

**Activity Data:**
- Based on the 2024 Compendium of Physical Activities
- Over 1000 activities with scientifically validated MET values
- Activities stored in hierarchical JSON structure for fast lookup
- Each intensity level has specific MET values and example descriptions

**Logging Process:**
1. Select category → subcategory → activity → intensity
2. Choose date (defaults to today, can select past dates within competition)
3. Enter duration in minutes
4. Review and confirm submission
5. Automatic point calculation using MET formula

### Point System

Points are calculated using the scientifically validated MET-hour formula:

```
Points = (MET × Duration in minutes) / 60
```

**Benefits of this system:**
- Fair comparison across different activity types
- Rewards both intensity (MET value) and duration
- Easy to understand (roughly equals hours of moderate activity)
- Prevents gaming the system (can't just log many short activities)

**Examples:**
- 30 min moderate running (MET 8.0): `(8.0 × 30) / 60 = 4.0 points`
- 60 min brisk walking (MET 3.5): `(3.5 × 60) / 60 = 3.5 points`
- 90 min easy cycling (MET 6.0): `(6.0 × 90) / 60 = 9.0 points`

### User Registration

Simple two-step registration process:
1. Accept terms and conditions
2. Select guild affiliation
3. Confirm registration

**Data Collected:**
- Telegram ID (for authentication)
- First name and username (from Telegram profile)
- Guild affiliation (user-selected)
- Registration timestamp

### Statistics & Rankings

Comprehensive statistics available to all users:

**Personal Statistics:**
- Total points accumulated
- Global ranking among all users
- Guild ranking among guild members
- Activity history with dates and points
- Nearby users in rankings (±2 positions)

**Guild Statistics:**
- Guild leaderboard with all metrics
- Historical ranking trends (last 30 days)
- Participation rates
- Average points per member over time

**Leaderboard Types:**
1. **Global Leaderboard**: Top 20 users by total points
2. **Guild Leaderboard**: Guilds ranked by average points per member
3. **Personal Nearby Rankings**: Your position with 2 users above/below
4. **Guild Nearby Rankings**: Your position within your guild

### Web Application

A modern React-based web app for data visualization:
- Personal activity statistics and trends
- Guild performance analytics
- Interactive charts and graphs
- Hall of Fame (top performers)
- Responsive design for mobile and desktop

*(Detailed webapp documentation maintained separately)*

## Technical Features

### Performance Optimizations

**Guild Leaderboard Caching:**
- In-memory cache with 5-minute TTL
- Reduces database load for frequently accessed data
- Force refresh option for immediate updates
- Cache invalidation on new activity submissions

**Database Indexing:**
- Optimized indexes on frequently queried columns
- Composite indexes for complex queries (user_id + date)
- Partial indexes for conditional queries (WHERE guild IS NOT NULL)

**Efficient Queries:**
- Window functions (RANK, COUNT OVER) for leaderboard calculations
- CTE (Common Table Expressions) for complex ranking logic
- Batch operations where possible

### Database Schema

Simple, normalized schema with three main tables:

1. **users**: User profiles and total points
2. **activities**: Activity logs with dates, types, and points
3. **feedback**: User feedback collection (optional feature)

**Key Design Decisions:**
- Points stored in both `users.points` (aggregated) and `activities.points` (individual)
- Activity dates separate from creation timestamps for historical logging
- Unique constraint prevents duplicate submissions (same activity within same minute)
- Cascading deletes ensure data consistency

### Bot Architecture

**Conversation Flows (Wizards):**
- Activity logging wizard (7 steps)
- Registration wizard (3 steps)
- Navigation between steps with state management

**Message Management:**
- Two-message manager pattern for clean UX
- Automatic cleanup of previous messages
- Inline keyboards for navigation
- Callback query handling with data validation

**Error Handling:**
- Comprehensive input validation
- User-friendly error messages
- Database transaction support
- Graceful degradation on failures

### Security & Privacy

**Data Minimization:**
- Only Telegram ID, name, and guild stored
- No location data or personal health information
- No tracking of external activity apps

**Input Validation:**
- All user inputs validated before database operations
- SQL injection protection (parameterized queries)
- Type safety with TypeScript
- Date validation for competition periods

**Access Control:**
- Users can only view their own detailed activity history
- Guild statistics visible to all (no individual data)
- Admin operations require environment configuration

## User Experience Features

### Inline Keyboards

All interactions use Telegram's inline keyboards for a native app experience:
- No typing required for navigation
- Clear visual buttons for all options
- Back/Cancel buttons on every step
- Confirmation dialogs for important actions

### Date Selection

Custom calendar interface for selecting activity dates:
- Month/year navigation
- Only dates within competition period selectable
- Visual highlighting of selected date
- Quick "Today" option

### Activity Search

*(Future feature - currently not implemented)*
The bot is designed to support fuzzy text search for activities as an alternative to hierarchical navigation.

### Feedback System

Optional feedback collection feature:
- 1-5 star ratings for ease of use, usefulness, and satisfaction
- Free-text feedback field
- Admin review interface
- Helps improve the bot over time

## Competition Management

### Time-Bound Competitions

Competitions have defined periods:
- Start date (activities before this date aren't counted)
- End date (activities after this date aren't allowed)
- Competition name and description
- Validation on startup to prevent misconfiguration

**Competition State Functions:**
- Check if competition is currently active
- Calculate days remaining
- Calculate days elapsed
- Get competition progress percentage

### Guild Configuration

Guilds are configured in code with:
- Guild name (display name)
- Total membership count (for average calculation)
- Active status (can disable guilds)

**No Database Foreign Keys:**
Guild names in the users table are validated at the application layer, allowing flexible guild management without database migrations.

## Admin Features

### Database Operations

- SQL schema migration scripts
- Backup and restore procedures
- Data export capabilities
- User and activity management

### Monitoring

- Cache statistics and health checks
- Database connection pooling
- Error logging and reporting
- Performance metrics

### Configuration Management

Environment-based configuration for:
- Database connection strings
- Telegram bot token
- Competition dates and settings
- Guild configurations
- Feature flags