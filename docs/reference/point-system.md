# Point System

The Activity Challenge Bot uses a scientifically validated point system based on Metabolic Equivalents of Task (METs) to ensure fair scoring across all types of physical activities.

## Overview

Points are awarded using the **MET-hour** formula, which takes into account both the intensity of an activity (measured in METs) and its duration. This ensures that a vigorous 20-minute workout and a moderate 40-minute walk can be fairly compared.

## The Formula

```
Points = (MET × Duration in minutes) / 60
```

**Where:**
- **MET** = Metabolic Equivalent of Task (from the activity database)
- **Duration** = Time spent on the activity in minutes
- **60** = Normalization factor (converts to hours, keeps points manageable)

### Why This Formula?

1. **Scientifically Valid**: METs are a standardized way to measure activity intensity used in exercise physiology research
2. **Fair Comparison**: Activities of different types can be objectively compared
3. **Intuitive**: The result roughly equals "hours of moderate activity"
4. **Prevents Gaming**: You can't accumulate excessive points by logging many 1-minute activities

## MET Values

MET values represent how many times more energy you burn compared to sitting at rest (1 MET = resting metabolic rate).

### Common MET Ranges

| Activity Intensity | MET Range | Examples |
|-------------------|-----------|----------|
| Light | 1.5 - 3.0 | Slow walking, stretching, light household chores |
| Moderate | 3.0 - 6.0 | Brisk walking, recreational cycling, moderate swimming |
| Vigorous | 6.0 - 9.0 | Running, fast cycling, competitive sports |
| Very Vigorous | 9.0+ | Competitive running, intense interval training |

### Data Source

All MET values come from the **2024 Compendium of Physical Activities**, a comprehensive research compilation maintained by Arizona State University. This database includes:
- Over 10 specific activities
- Scientifically validated MET values
- Multiple intensity levels for most activities
- Detailed example descriptions

**Citation**: Ainsworth BE, Haskell WL, Herrmann SD, et al. 2024 Compendium of Physical Activities. Available at: https://pacompendium.com/

## Point Example: Running (Moderate Pace)

```
Activity: Running, jogging
Intensity: General (MET = 8.0)
Duration: 30 minutes

Points = (8.0 × 30) / 60 = 4.0 points
```

## Expected Weekly Points

To help you understand what "good" performance looks like:

| Activity Level | Daily Average | Weekly Total | Description |
|---------------|---------------|--------------|-------------|
| Beginner | 2-3 points/day | 14-21 points/week | 30 min/day of moderate activity |
| Active | 4-6 points/day | 28-42 points/week | 45-60 min/day of varied activities |
| Very Active | 7-10 points/day | 49-70 points/week | 60-90 min/day of moderate-vigorous activity |
| Athlete | 10-15 points/day | 70-105 points/week | 90+ min/day of intense training |

**Note**: These are general guidelines. Your personal goals should be based on your current fitness level, health status, and available time.

## Guild Rankings

Guilds are ranked by **average points per member**, not total points. This ensures fair competition regardless of guild size.

### Guild Scoring Formula

```
Guild Average = Total Guild Points / Total Guild Membership
```

**Where:**
- **Total Guild Points** = Sum of points from all guild members (including those with 0 points)
- **Total Guild Membership** = Configured membership count for the guild

### Why Average Points?

1. **Fair for Small Guilds**: A small, highly active guild can compete with larger guilds
2. **Encourages Participation**: Guilds benefit from getting more members active, not just recruiting
3. **Sustainable**: Doesn't create pressure for unsustainable activity levels
4. **Team Spirit**: Every member's contribution matters equally

### Guild Metrics

The leaderboard shows several metrics for context:

- **Average Points**: The ranking metric (points per total member)
- **Total Points**: Raw sum of all member points
- **Active Members**: Members who have logged at least one activity
- **Registered Members**: Members who have signed up for the bot
- **Total Members**: Configured guild membership count
- **Participation %**: (Active Members / Total Members) × 100

### Example Guild Comparison

| Guild | Total Members | Active | Total Points | Avg Points | Rank |
|-------|--------------|--------|--------------|------------|------|
| TiK | 200 | 80 | 1200 | 6.0 | 1 |
| AS | 150 | 60 | 750 | 5.0 | 2 |
| KY | 300 | 120 | 1350 | 4.5 | 3 |

Even though KY has the most total points, TiK wins because of higher average points per member.

## Future Enhancements

Potential point system improvements being considered:

1. **Achievement Bonuses**: Extra points for milestones (first activity, weekly streaks, etc.)
2. **Social Event Multipliers**: Bonus points for participating in group activities
3. **Beginner Boost**: Temporary point multiplier for new users to help them get started
4. **Activity Diversity Bonus**: Encourage trying different types of activities
5. **Weekly Challenges**: Temporary special scoring for specific activities
6. **Single Source for User points**: Apply the same caching logic for user points that is used for guild points