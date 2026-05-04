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
  const digitsOnly = String(value ?? '').replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+91 ${digitsOnly.slice(2, 7)} ${digitsOnly.slice(7)}`;
  }

  return null;
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

