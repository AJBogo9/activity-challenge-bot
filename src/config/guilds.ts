/**
 * Guild configuration
 * This is the single source of truth for guild information
 */
export interface GuildConfig {
  name: string;
  totalMembers: number;
  isActive: boolean;
}

export const GUILDS: GuildConfig[] = [
  { name: "TiK", totalMembers: 700, isActive: true },
  { name: "SIK", totalMembers: 450, isActive: true },
  { name: "AS", totalMembers: 650, isActive: true },
  { name: "FK", totalMembers: 600, isActive: true },
  { name: "Athene", totalMembers: 350, isActive: true },
  { name: "MK", totalMembers: 400, isActive: true },
  { name: "Aalto Accounting", totalMembers: 450, isActive: true },
  { name: "Inkubio", totalMembers: 400, isActive: true },
  { name: "Prodeko", totalMembers: 650, isActive: true },
];

/**
 * Get all active guilds
 */
export function getActiveGuilds(): GuildConfig[] {
  return GUILDS.filter(g => g.isActive);
}

/**
 * Get guild configuration by name
 */
export function getGuildConfig(name: string): GuildConfig | undefined {
  return GUILDS.find(g => g.name === name);
}

/**
 * Get all active guild display names
 */
export function getGuildNames(): string[] {
  return getActiveGuilds()
    .map(g => g.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Validate if a guild name is valid and active
 */
export function isValidGuild(name: string): boolean {
  const guild = getGuildConfig(name);
  return guild !== undefined && guild.isActive;
}

/**
 * Get total member count for a guild
 */
export function getGuildTotalMembers(name: string): number | undefined {
  return getGuildConfig(name)?.totalMembers;
}