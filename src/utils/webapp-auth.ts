import crypto from 'crypto';

/**
 * Validates Telegram WebApp initData
 */
export function validateInitData(initData: string, botToken: string): boolean {
  if (!initData) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}

/**
 * Extracts user data from initData
 */
export function getWebAppData(initData: string) {
  const urlParams = new URLSearchParams(initData);
  const userString = urlParams.get('user');
  if (!userString) return null;
  
  try {
    return JSON.parse(userString);
  } catch (e) {
    return null;
  }
}
