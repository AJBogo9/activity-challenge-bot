/**
 * Centralized text constants for the bot
 * Organized by feature/context for easy maintenance
 * All messages are properly escaped for MarkdownV2
 */

export const ERROR_MESSAGE = 
  "Something went wrong while processing your request\\. Please try again\\. " +
  "We've logged the error for further review, but if the issue persists or you need " +
  "immediate assistance, please contact support\\.";

export const POINTS_INFO_MESSAGE = `*How Points Work*

Your points are calculated using MET\\-hours, a standard measure that accounts for both the intensity and duration of your activities\\.

*The Formula:* Points \\= \\(MET × Duration in minutes\\) ÷ 60

*What are METs?* MET \\(Metabolic Equivalent of Task\\) measures how intense an activity is:
• 1 MET \\= sitting quietly
• 3 METs \\= walking casually
• 8 METs \\= running
• 12\\+ METs \\= intense sports

Higher intensity activities have higher MET values and earn more points per minute\\.

Source: https://pacompendium\\.com/adult\\-compendium/`;

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
The bot may change or stop at any time\\. We're not liable for issues from using it\\. Terms may update without notice\\.`;

export const ABOUT_BOT_MESSAGE = `*About This Bot*

This bot is *completely open source* and *free to use\\!*

*Open Source & Community\\-Driven*
The entire codebase is publicly available on GitHub\\. Anyone can view the code, learn from it, or use it for their own projects\\.

*Repository:* [github\\.com/AJBogo9/activity\\-challenge\\-bot](https://github.com/AJBogo9/activity-challenge-bot)`;