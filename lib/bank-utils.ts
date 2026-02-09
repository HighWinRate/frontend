export function formatCardNumber(cardNumber: string): string {
  const digits = String(cardNumber).replace(/\D/g, '');
  if (digits.length !== 16) return cardNumber;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12, 16)}`;
}

export function formatIBAN(iban: string): string {
  const s = String(iban).replace(/\s/g, '');
  if (s.length < 4) return s;
  const parts: string[] = [];
  for (let i = 0; i < s.length; i += 4) {
    parts.push(s.slice(i, i + 4));
  }
  return parts.join('-');
}

export function getBankLogo(bankName: string): string | null {
  // Optional: map bank names to logo paths under /images/banks/
  return null;
}
