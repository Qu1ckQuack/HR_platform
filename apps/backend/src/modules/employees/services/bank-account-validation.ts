export function getBankAccountValidationError(value: string): string | null {
  if (!value) return "กรุณากรอกบัญชีธนาคาร";
  if (!/^\d{1,15}$/.test(value)) return "เลขบัญชีธนาคารต้องเป็นตัวเลขไม่เกิน 15 หลัก";
  return null;
}
