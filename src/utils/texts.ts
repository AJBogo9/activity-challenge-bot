/**
 * Centralized text constants for the bot
 * Organized by feature/context for easy maintenance
 * All messages are properly escaped for MarkdownV2
 */

export const ERROR_MESSAGE = 
  "Something went wrong while processing your request\\. Please try again\\. " +
  "We've logged the error for further review, but if the issue persists or you need "


export const PRIVATE_CHAT_HELP = `*Help and Commands Overview* 🛠️

/start \\- Get introduction & instructions to get basic information about the competition\\.

/register \\- Initiate your registration and set up your profile\\.

/createteam \\- Form a new team\\.

/jointeam \\- Join an existing team\\. You will need the team ID, provided to who created the team\\.

/addexercise \\- Log your Kilometer\\-based and Hour\\-based training\\.

/weekscores \\- Log your weekly achievements to earn points every Sunday\\.

/howtogetpoints \\- Discover the various ways to earn points\\.

/statsinfo \\- Show commands for getting rankings and stats\\.

/terms \\- Read current terms and conditions\\.`

export const GROUP_CHAT_HELP = `*Help and Commands Overview* 🛠️

/leaderboards \\- View 30 teams with most points and their rankings\\.

/team \\- Check your team members' contributions\\.

/summary \\- Get your personal points summary\\.

/topguilds \\- See guild standings in the competition\\.

/topguildsall \\- Compare guild points in more detail\\.

/topusers \\- See top 15 users in the competition

Please interact with me in a private chat for full features and more detailed commands\\.`

export const POINTS_INFO_MESSAGE = `*How Points Work*

Your points are calculated using MET\\-hours, a standard measure that accounts for both the intensity and duration of your activities\\.

*The Formula:* Points \\= \\(MET × Duration in minutes\\) ÷ 60

*What are METs?* MET \\(Metabolic Equivalent of Task\\) measures how intense an activity is:
\\- 1 MET \\= sitting quietly
\\- 3 METs \\= walking casually
\\- 8 METs \\= running
\\- 12\\+ METs \\= intense sports

Higher intensity activities have higher MET values and earn more points per minute\\.

Source: https://pacompendium\\.com/adult\\-compendium/`

export const WELCOME_MESSAGE = `*Welcome to the Kesäkuntoon Competition\\!* 🎉

This competition, organised by Aava's Sport Committee, is designed to encourage a healthier lifestyle through friendly competition\\. As a participant, you'll earn points by engaging in various health and fitness activities, contributing both to your personal score and your team's overall performance\\.

_Every point counts\\!_`

export const STATS_INFO_MESSAGE = `*Discover Your Stats and Rankings\\!* 🏆

Use these commands to track your and your team's progress:

/leaderboards \\- See top 15 teams in the competition

/team \\- Check your team members' contributions

/summary \\- Get your personal points summary

/topguilds \\- See guild standings in the competition

/topguildsall \\- Compare guild points in more detail

/topusers \\- See top 15 participants in the competition

Stay motivated and see how your efforts stack up against the competition\\!`

export const TERMS_AND_CONDITIONS = `*Terms and Conditions*

By using this bot, you agree to these terms\\.

*About the Bot*
This bot tracks activity points for the Aalto guild competition\\. It's free to use and open source\\.

*Your Data*
We collect your Telegram ID, username, and activity logs\\. Your data won't be shared with third parties\\. You can request deletion anytime\\.

*Rules*
• No offensive names or behavior
• Violations may result in disqualification

*Important*
The bot may change or stop at any time\\. We're not liable for issues from using it\\. Terms may update without notice\\.`

export const ABOUT_BOT_MESSAGE = `*About This Bot*

This bot is *completely open source* and *free to use\\!*

*Open Source & Community\\-Driven*

The entire codebase is publicly available on GitHub\\. Anyone can view the code, learn from it, or use it for their own projects\\.

*Repository:* [github\\.com/AJBogo9/activity\\-challenge\\-bot](https://github.com/AJBogo9/activity-challenge-bot)`