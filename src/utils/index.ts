/**
 * Format a date to Finnish format: DD.MM.YYYY
 * @param date - Date object, date string, or ISO string
 * @returns Formatted date string (e.g., "04.01.2026")
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  
  return `${day}.${month}.${year}`
}

export { TwoMessageManager } from './two-message-manager'
export * from './calendar'
export * from './format-list'
export * from './texts'