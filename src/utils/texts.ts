export const texts = {
  actions: {
    feedback: {
      start: "Please share your feedback — positive, negative, or suggestions for improvement. Your feedback is anonymous. To cancel, type 'cancel'.",
      finish: "Thank you for from your feedback!",
      end: "Give feedback next time!"
    },
    error: {
      error: "Something went wrong while processing your request. Please try again. We've logged the error for further review, but if the issue persists or you need immediate help, contact @EppuRuotsalainen on Telegram."
    }
  },
  terms: {
    only_terms: 'Using SummerBodyBot, you agree to the following terms and conditions. This bot is designed to collect and record scores for participants in the competition among Aalto guilds, as well as within teams. Please note that the functionality of the bot may be modified or discontinued at any time without prior notice. The administrators and developers of SummerBodyBot are not liable for any adverse outcomes that may result from participation in the competition or use of the bot.\n\nParticipation in the competition and use of SummerBodyBot are provided free of charge for members of Aalto guilds. In order to track scores, the bot gathers certain user information, which will not be sold or disclosed to any third party. Users may request deletion of their personal data at any time.\n\nOffensive team names or inappropriate behavior during the competition are strictly prohibited. Any team found engaging in such actions will be disqualified, and the associated user may be banned from further participation. All collected data will be deleted after the conclusion of the competition.\n\nThe most current version of these terms and conditions is available via the /terms command. These terms may be updated at any time without prior notice.',
  }
}

export const PRIVATE_CHAT_HELP = `*Help and Commands Overview* 🛠️

/start - Get introduction & instructions to get basic information about the competition.

/register - Initiate your registration and set up your profile.

/createteam - Form a new team.

/jointeam - Join an existing team. You will need the team ID, provided to who created the team.

/addexercise - Log your Kilometer-based and Hour-based training.

/weekscores - Log your weekly achievements to earn points every Sunday.

/howtogetpoints - Discover the various ways to earn points.

/statsinfo - Show commands for getting rankings and stats.

/terms - Read current terms and conditions.

If there is something that you did not understand or something problematic comes up you can send me a message on Telegram @EppuRuotsalainen.`

export const GROUP_CHAT_HELP = `*Help and Commands Overview* 🛠️

/leaderboards - View 30 teams with most points and their rankings.

/team - Check your team members' contributions.

/summary - Get your personal points summary.

/topguilds - See guild standings in the competition.

/topguildsall - Compare guild points in more detail.

/topusers - See top 15 users in the competition

Please interact with me in a private chat for full features and more detailed commands.`

export const POINTS_INFO_MESSAGE = `*How to Earn Points* 🌟

You can log your Kilometer-based and Hour-based training at any time with the command /addexercise, and all other activities once a week on Sundays using the command /weekscores. Here's how you can earn them:

1. *Kilometer-based Activities*:
   - Running/Walking: 1 point per km
   - Cycling: 0.25 points per km
   - Swimming: 4 points per km
   - Ice Skating: 0.25 points per km
   - Skiing: 0.5 points per km

2. *Hour-based Training*:
   - Low Intensity: 2 point per hour
   - Moderate Intensity: 4 points per hour
   - Vigorous Intensity: 8 points per hour

3. *Sports Sessions*: 5 points for participating in a sports session (for example, your guild's regular weekly session or a sports try-out / jogging session).

4. *New Sport*: 5 points for trying a new or long-unpracticed sport.

5. *New Healthy Recipe*: 5 points for trying out a new healthy recipe this week.

6. *Good Sleep*: 8 points for sleeping 7+ hours at least 5 nights in a week.

7. *Meditation*: 5 points for meditating at least 10 minutes on 5 days during the past week.

8. *Less Alcohol*: 10 points for consuming at most 5 portions of alcohol during the week.`

export const WELCOME_MESSAGE = `*Welcome to the Kesäkuntoon Competition!* 🎉

This competition, organised by Aava's Sport Committee, is designed to encourage a healthier lifestyle through friendly competition. As a participant, you'll earn points by engaging in various health and fitness activities, contributing both to your personal score and your team's overall performance.

_Every point counts!_`

export const INSTRUCTIONS_MESSAGE = `*Getting Started:*

1. *Register*: Begin by registering with the command /register.

2. *Team Participation*: You may choose to team up with other fellow students, but participation as an individual is also welcome. If you decide to form or join a team, use the /createteam or /jointeam commands.

3. *Earning Points & Tracking Progress*: Use /howtogetpoints to learn how to get points. Amp up the excitement by checking rankings and stats — learn more with command /statsinfo.

4. *Assistance*: Need help? The /help command lists all available commands and their functions.`

export const STATS_INFO_MESSAGE = `*Discover Your Stats and Rankings!* 🏆

Use these commands to track your and your team's progress:

/leaderboards - See top 15 teams in the competition

/team - Check your team members' contributions

/summary - Get your personal points summary

/topguilds - See guild standings in the competition

/topguildsall - Compare guild points in more detail

/topusers - See top 15 participants in the competition

Stay motivated and see how your efforts stack up against the competition!`

const TERMS_AND_CONDITIONS = `Using SummerBodyBot, you agree to the following terms and conditions. This bot is designed to collect and record scores for participants in the competition among Aalto guilds, as well as within teams. Please note that the functionality of the bot may be modified or discontinued at any time without prior notice. The administrators and developers of SummerBodyBot are not liable for any adverse outcomes that may result from participation in the competition or use of the bot.

Participation in the competition and use of SummerBodyBot are provided free of charge for members of Aalto guilds. In order to track scores, the bot gathers certain user information, which will not be sold or disclosed to any third party. Users may request deletion of their personal data at any time.

Offensive team names or inappropriate behavior during the competition are strictly prohibited. Any team found engaging in such actions will be disqualified, and the associated user may be banned from further participation. All collected data will be deleted after the conclusion of the competition.

The most current version of these terms and conditions is available via the /terms command. These terms may be updated at any time without prior notice.`

export const TERMS_MESSAGE = `*Terms and Conditions*

${TERMS_AND_CONDITIONS}`