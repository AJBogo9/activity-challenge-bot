export default [
  // Most frequently used - Core actions
  { command: 'start', scene: 'start_wizard', private: true, description: '🏁 Start and register' },
  { command: 'addexercise', scene: 'sports_activity_wizard', private: true, description: '✅ Log exercise activity' },
  { command: 'summary', scene: 'user_summary_scene', private: false, description: '📊 Your summary' },

  // Frequently used - Team & rankings
  { command: 'team', scene: 'team_member_rankings_scene', private: false, description: '👥 View team rankings' },
  { command: 'leaderboards', scene: 'team_rankings_scene', private: false, description: '🏆 Team leaderboards' },
  { command: 'topguilds', scene: 'guild_standings_scene', private: false, description: '🎓 Top guilds' },
  { command: 'topusers', scene: 'top_users_scene', private: false, description: '⭐ Top users' },
  { command: 'weekscores', scene: 'week_scores_wizard', private: true, description: '📅 View weekly scores' },

  // Moderate use - Setup & information
  { command: 'register', scene: 'register_wizard', private: true, description: '📝 Register for competition' },
  { command: 'createteam', scene: 'create_team_wizard', private: true, description: '👥 Create a new team' },
  { command: 'jointeam', scene: 'join_team_wizard', private: true, description: '🤝 Join an existing team' },
  { command: 'help', scene: 'help_scene', private: false, description: '❓ Get help' },
  { command: 'howtogetpoints', scene: 'how_to_get_points_scene', private: true, description: '💯 How to earn points' },

  // Occasional use - Additional rankings
  { command: 'topguilds50', scene: 'guild_top_standings_scene', private: false, description: '🎓 Top 50% guilds' },
  { command: 'topguildsall', scene: 'guild_comparison_scene', private: false, description: '🎓 All guilds comparison' },
  { command: 'statsinfo', scene: 'stats_info_scene', private: true, description: '📈 Stats info' },

  // Rarely used - Admin & settings
  { command: 'adjustpoints', scene: 'adjust_points_wizard', private: true, description: '⚙️ Adjust points' },
  { command: 'feedback', scene: 'feedback_wizard', private: true, description: '💬 Send feedback' },
  { command: 'terms', scene: 'terms_scene', private: true, description: '📜 Terms and conditions' },

  // Least used - Account management
  { command: 'rmuser', scene: 'delete_user_wizard', private: true, description: '🗑️ Delete account' },
]