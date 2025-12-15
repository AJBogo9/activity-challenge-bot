import { Scenes, Markup } from 'telegraf'
import * as userService from '../../services/user-service'

/**
 * Main menu scene using reply keyboard
 * Shows Register button if user hasn't registered yet
 */
export const menuScene = new Scenes.BaseScene<any>('menu_scene')

// Menu keyboard for registered users
const registeredMenuKeyboard = Markup.keyboard([
    ['👤 Profile', '💪 Activities'],
    ['📊 Statistics', '👥 Teams'],
    ['ℹ️ Information']
]).resize()

// Menu keyboard for unregistered users - includes Register button prominently
const unregisteredMenuKeyboard = Markup.keyboard([
    ['📝 Register'],
    ['ℹ️ Information']
]).resize()

// Sub-menu keyboards
const profileKeyboard = Markup.keyboard([
    ['📊 My Summary'],
    ['🗑️ Delete Account'],
    ['« Back to Menu']
]).resize()

const activitiesKeyboard = Markup.keyboard([
    ['✅ Log Exercise'],
    ['📅 Weekly Scores'],
    ['💯 How to Earn Points'],
    ['« Back to Menu']
]).resize()

const statsKeyboard = Markup.keyboard([
    ['🏆 Leaderboards', '⭐ Top Users'],
    ['🎓 Top Guilds', '🎓 All Guilds'],
    ['📈 Stats Info'],
    ['« Back to Menu']
]).resize()

const teamsKeyboard = Markup.keyboard([
    ['👥 Team Rankings'],
    ['➕ Create Team'],
    ['🤝 Join Team'],
    ['« Back to Menu']
]).resize()

const infoKeyboard = Markup.keyboard([
    ['🏁 Start / Intro'],
    ['❓ Help'],
    ['📜 Terms'],
    ['💬 Feedback'],
    ['« Back to Menu']
]).resize()

// Scene enter - show appropriate menu based on registration status
menuScene.enter(async (ctx: any) => {
    const userName = ctx.from?.first_name || 'there'
    const user = await userService.findUser(ctx.from.id)

    if (user) {
        const message = `👋 Hello, ${userName}!\n\nWhat would you like to do?`
        await ctx.reply(message, registeredMenuKeyboard)
    } else {
        const message = `👋 Hello, ${userName}!\n\nWelcome! Please register to get started.`
        await ctx.reply(message, unregisteredMenuKeyboard)
    }
})

// Main menu category handlers
menuScene.hears('👤 Profile', async (ctx: any) => {
    await ctx.reply('👤 Profile\n\nManage your profile:', profileKeyboard)
})

menuScene.hears('💪 Activities', async (ctx: any) => {
    await ctx.reply('💪 Activities\n\nLog and track:', activitiesKeyboard)
})

menuScene.hears('📊 Statistics', async (ctx: any) => {
    await ctx.reply('📊 Statistics\n\nView rankings:', statsKeyboard)
})

menuScene.hears('👥 Teams', async (ctx: any) => {
    await ctx.reply('👥 Teams\n\nTeam management:', teamsKeyboard)
})

menuScene.hears('ℹ️ Information', async (ctx: any) => {
    await ctx.reply('ℹ️ Information\n\nHelp & info:', infoKeyboard)
})

// Back to main menu - check registration status again
menuScene.hears('« Back to Menu', async (ctx: any) => {
    const userName = ctx.from?.first_name || 'there'
    const user = await userService.findUser(ctx.from.id)

    if (user) {
        await ctx.reply(`What would you like to do?`, registeredMenuKeyboard)
    } else {
        await ctx.reply(`Please register to get started.`, unregisteredMenuKeyboard)
    }
})

// Profile sub-menu actions
menuScene.hears('📊 My Summary', async (ctx: any) => {
    await ctx.scene.enter('user_summary_scene')
})

menuScene.hears('🗑️ Delete Account', async (ctx: any) => {
    await ctx.scene.enter('delete_user_wizard')
})

// Activities sub-menu actions
menuScene.hears('✅ Log Exercise', async (ctx: any) => {
    await ctx.scene.enter('sports_activity_wizard')
})

menuScene.hears('📅 Weekly Scores', async (ctx: any) => {
    await ctx.scene.enter('week_scores_wizard')
})

menuScene.hears('💯 How to Earn Points', async (ctx: any) => {
    await ctx.scene.enter('how_to_get_points_scene')
})

// Statistics sub-menu actions
menuScene.hears('🏆 Leaderboards', async (ctx: any) => {
    await ctx.scene.enter('team_rankings_scene')
})

menuScene.hears('⭐ Top Users', async (ctx: any) => {
    await ctx.scene.enter('top_users_scene')
})

menuScene.hears('🎓 Top Guilds', async (ctx: any) => {
    await ctx.scene.enter('guild_standings_scene')
})

menuScene.hears('🎓 All Guilds', async (ctx: any) => {
    await ctx.scene.enter('guild_comparison_scene')
})

menuScene.hears('📈 Stats Info', async (ctx: any) => {
    await ctx.scene.enter('stats_info_scene')
})

// Teams sub-menu actions
menuScene.hears('👥 Team Rankings', async (ctx: any) => {
    await ctx.scene.enter('team_member_rankings_scene')
})

menuScene.hears('➕ Create Team', async (ctx: any) => {
    await ctx.scene.enter('create_team_wizard')
})

menuScene.hears('🤝 Join Team', async (ctx: any) => {
    await ctx.scene.enter('join_team_wizard')
})

// Info sub-menu actions
menuScene.hears('🏁 Start / Intro', async (ctx: any) => {
    await ctx.scene.enter('start_wizard')
})

menuScene.hears('❓ Help', async (ctx: any) => {
    await ctx.scene.enter('help_scene')
})

menuScene.hears('📜 Terms', async (ctx: any) => {
    await ctx.scene.enter('terms_scene')
})

menuScene.hears('💬 Feedback', async (ctx: any) => {
    await ctx.scene.enter('feedback_wizard')
})

// Register action for unregistered users
menuScene.hears('📝 Register', async (ctx: any) => {
    await ctx.scene.enter('register_wizard')
})
