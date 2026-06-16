/**
 * Bitcoin Address Validator
 */

export interface ValidationResponse {
  isValid: boolean;
  type: string;
}

export function validateBitcoinAddress(address: string): ValidationResponse {
  if (!address) {
    return { isValid: false, type: "Empty" };
  }

  const cleanAddr = address.trim();

  // Legacy P2PKH (starts with 1, length 26-35, alphanumeric, excludes l, I, O, 0)
  const legacyRegex = /^[1][1-9A-HJ-NP-Za-km-z]{25,34}$/;
  if (legacyRegex.test(cleanAddr)) {
    return { isValid: true, type: "P2PKH (Legacy)" };
  }

  // Nested SegWit P2SH (starts with 3, length 26-35, alphanumeric, excludes l, I, O, 0)
  const p2shRegex = /^[3][1-9A-HJ-NP-Za-km-z]{25,34}$/;
  if (p2shRegex.test(cleanAddr)) {
    return { isValid: true, type: "P2SH (Nested SegWit)" };
  }

  // Native SegWit P2WPKH (starts with bc1q, length 42, alphanumeric lowercase, excludes b, i, o, 1)
  const bech32Regex = /^bc1q[0-9a-z]{38}$/i;
  if (bech32Regex.test(cleanAddr)) {
    return { isValid: true, type: "P2WPKH (Native SegWit)" };
  }

  // Taproot P2TR (starts with bc1p, length 62, alphanumeric lowercase, excludes b, i, o, 1)
  const bech32mRegex = /^bc1p[0-9a-z]{58}$/i;
  if (bech32mRegex.test(cleanAddr)) {
    return { isValid: true, type: "P2TR (Taproot)" };
  }

  return { isValid: false, type: "Invalid" };
}
