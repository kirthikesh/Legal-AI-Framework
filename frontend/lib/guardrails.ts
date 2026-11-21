// Input guardrails run BEFORE a prompt leaves the app.
// In production, add Amazon Bedrock Guardrails on top of these as a second layer.

export interface GuardrailResult {
  allowed: boolean;
  reason?: string;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Payment card numbers: 13-19 digits (spaces/dashes allowed) that pass the Luhn check. */
export function containsCardNumber(text: string): boolean {
  const candidates = text.match(/\b(?:\d[ -]?){12,18}\d\b/g) ?? [];
  return candidates.some((c) => {
    const digits = c.replace(/[ -]/g, "");
    return digits.length >= 13 && digits.length <= 19 && luhnValid(digits);
  });
}

/** Irish PPS numbers: 7 digits followed by 1-2 letters, e.g. 1234567T or 1234567TW. */
export function containsPpsNumber(text: string): boolean {
  return /\b\d{7}[A-W][A-IW]?\b/i.test(text);
}

export const MAX_PROMPT_CHARS = 4000;

export function checkPrompt(text: string): GuardrailResult {
  if (!text.trim()) return { allowed: false, reason: "Empty prompt" };
  if (text.length > MAX_PROMPT_CHARS) return { allowed: false, reason: `Prompt longer than ${MAX_PROMPT_CHARS} characters` };
  if (containsCardNumber(text)) return { allowed: false, reason: "Payment card number detected" };
  if (containsPpsNumber(text)) return { allowed: false, reason: "Personal ID (PPS number) detected" };
  return { allowed: true };
}
