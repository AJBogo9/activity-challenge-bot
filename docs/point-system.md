# Dataset: 2024 Compendium of Physical Activities 

https://pacompendium.com/

# Formula for calculating points:

$$\text{Points} = \frac{\text{MET} \times \text{Duration (min)}}{60}$$

This metric is called MET-hours. This metric takes the intensity (MET) and duration (Duration (min)) into account and then normalizes it with 60 to keep points small, easily readable and understandable.

# Approximated points per week by athletes

- Casual exerciser: 30 min/day moderate activity = ~3-4 points/day = 20-30 points/week
- Active person: 60 min/day varied activities = ~6-8 points/day = 40-60 points/week
- Very active: 90 min/day intense activities = ~10-15 points/day = 70-100 points/week

Cap weekly activity points at 100 to prevent overtraining?

# Spot checks

- Proof of activity?
  - Screenshot of activity
  - Picture of the person doing the activity
  - GPS or heartrate data
- Required to be submitted, but will be checked only occationally.

# How to motivate beginners?

- Achievement milestones?
  - First activity logged: +5 points
  - First week with 5+ days active: +10 points
  - Tried 3 different activity types: +5 points
  - Reached 10 total MET-hours: +10 points
  - First 30-minute session: +5 points
  - 2 weeks streak: +15 points
  - Participate in a sports social event +5 points
  - Signing up for a race/competition +5 points
- Separate leadersboards so that beginners can win too?
  - **Groups** for leaderboards inside individual friend groups

# UX for point registering

- The main challenge is what is the best way for the user to choose from the 1000 activities listed in the dataset. Here are two possible solutions and the production solutions will likely be a combination of both.
  - Hierarchical category navigation
    - The user will use an inline keyboard to browse different activities
    - The activities can be sorted into a tree-like structure (already exists in dataset)
  - Fuzzy text search 
    - The user can search activities with a search bar. Then the fuzzy search will find the best matching activities to the search query.