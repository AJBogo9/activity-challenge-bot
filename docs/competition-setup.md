# Competition Setup Guide

## Configuring a New Competition

1. Open `src/config/competition.ts`
2. Update the `CURRENT_COMPETITION` object:
```typescript
   export const CURRENT_COMPETITION: CompetitionConfig = {
     name: "Your Competition Name",
     startDate: new Date("YYYY-MM-DD"),
     endDate: new Date("YYYY-MM-DD"),
     description: "Optional description"
   };
```
3. Commit the changes to git
4. Deploy the updated configuration

## Competition Lifecycle

- **Before Start**: Bot accepts registrations but not activities
- **During**: Full functionality active
- **After End**: Read-only mode, shows final results

## Testing

Run the bot with different system dates to test competition boundaries.