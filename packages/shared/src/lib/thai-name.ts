const THAI_NAME_PATTERN = /^[\u0E01-\u0E2E\u0E30-\u0E3A\u0E40-\u0E45\u0E47-\u0E4D ]+$/u;
const THAI_CONSONANT_PATTERN = /[\u0E01-\u0E2E]/u;

export function isThaiName(value: string): boolean {
  return THAI_NAME_PATTERN.test(value) && THAI_CONSONANT_PATTERN.test(value);
}
