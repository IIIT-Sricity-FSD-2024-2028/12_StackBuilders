import { randomUUID } from 'node:crypto';

export function cleanText(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeEmail(value: unknown): string {
  return cleanText(value).toLowerCase();
}

export function normalizeLookupValue(value: unknown): string {
  return cleanText(value).toLowerCase();
}

export function formatIndianPhoneNumber(value: unknown): string | null {
  const phone = String(value ?? '').trim();
  if (!phone || !/^\+?[\d\s()-]+$/.test(phone)) return null;

  const plusIndex = phone.indexOf('+');
  if (plusIndex > 0 || phone.indexOf('+', plusIndex + 1) !== -1) return null;

  const digitsOnly = phone.replace(/\D/g, '');
  const hasPlus = plusIndex === 0;
  if (hasPlus && (!phone.startsWith('+91') || digitsOnly.length !== 12)) {
    return null;
  }

  const mobileNumber =
    digitsOnly.length === 10
      ? digitsOnly
      : digitsOnly.length === 12 && digitsOnly.startsWith('91')
        ? digitsOnly.slice(2)
        : null;

  if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) return null;

  return `+91 ${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`;
}

export function isValidEmailAddress(value: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(cleanText(value));
}

export function isValidGmailAddress(value: unknown): boolean {
  return /^[a-z0-9._%+-]+@gmail\.com$/i.test(cleanText(value));
}

export function isValidPassword(value: unknown): boolean {
  return cleanText(value).length >= 6;
}

export function generateSequentialId(
  prefix: string,
  records: Array<{ id?: string }>,
): string {
  const highestExistingNumber = records.reduce((currentMax, record) => {
    const matchedNumber = String(record.id ?? '').match(
      new RegExp(`^${prefix}-(\\d+)$`),
    );

    if (!matchedNumber) {
      return currentMax;
    }

    return Math.max(currentMax, Number(matchedNumber[1]));
  }, 1000);

  return `${prefix}-${highestExistingNumber + 1}`;
}

export function createPrefixedRecordId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export function formatStoredDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '--';
  }

  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

