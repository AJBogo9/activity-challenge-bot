export default [
  // Main menu - Quick access to all features
  { command: 'menu', scene: 'menu_scene', private: true, description: '📋 Open main menu' },

  // Quick Actions - Most frequently used
  { command: 'addexercise', scene: 'sports_activity_wizard', private: true, description: '✅ Log exercise activity' },
  { command: 'summary', scene: 'user_summary_scene', private: false, description: '📊 Your summary' },
  { command: 'weekscores', scene: 'week_scores_wizard', private: true, description: '📅 View weekly scores' },

  // Rankings & Statistics
  { command: 'team', scene: 'team_member_rankings_scene', private: false, description: '👥 Team member rankings' },
  { command: 'leaderboards', scene: 'team_rankings_scene', private: false, description: '🏆 Team leaderboards' },
  { command: 'topusers', scene: 'top_users_scene', private: false, description: '⭐ Top users' },
  { command: 'topguilds', scene: 'guild_standings_scene', private: false, description: '🎓 Top guilds' },

  // Getting Started
  { command: 'start', scene: 'start_wizard', private: true, description: '🏁 Get started' },
  { command: 'register', scene: 'register_wizard', private: true, description: '📝 Register' },
  { command: 'help', scene: 'help_scene', private: false, description: '❓ Get help' },

  // Teams
  { command: 'createteam', scene: 'create_team_wizard', private: true, description: '➕ Create team' },
  { command: 'jointeam', scene: 'join_team_wizard', private: true, description: '🤝 Join team' },

  // More Statistics (less common)
  { command: 'topguilds50', scene: 'guild_top_standings_scene', private: false, description: '🎓 Top 50% guilds' },
  { command: 'topguildsall', scene: 'guild_comparison_scene', private: false, description: '🎓 All guilds' },
  { command: 'statsinfo', scene: 'stats_info_scene', private: true, description: '📈 Stats info' },
  { command: 'howtogetpoints', scene: 'how_to_get_points_scene', private: true, description: '💯 How to earn points' },

  // Settings & Other
  { command: 'adjustpoints', scene: 'adjust_points_wizard', private: true, description: '⚙️ Adjust points (admin)' },
  { command: 'feedback', scene: 'feedback_wizard', private: true, description: '💬 Send feedback' },
  { command: 'terms', scene: 'terms_scene', private: true, description: '📜 Terms' },
  { command: 'rmuser', scene: 'delete_user_wizard', private: true, description: '🗑️ Delete account' },
]