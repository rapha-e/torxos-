// ============================================================================
// TorxOS — Utilitário de Máscaras e Validações Globais
// ============================================================================

/**
 * Remove qualquer caractere não numérico
 */
export function onlyNumbers(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/**
 * Aplica máscara dinâmica para CPF (11 dígitos) ou CNPJ (14 dígitos)
 */
export function maskCpfCnpj(value: string | null | undefined): string {
  const digits = onlyNumbers(value).slice(0, 14);

  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/**
 * Validação algorítmica real de CPF
 */
export function isValidCpf(cpf: string): boolean {
  const clean = onlyNumbers(cpf);
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false; // Elimina sequências iguais como 111.111.111-11

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10))) return false;

  return true;
}

/**
 * Validação algorítmica real de CNPJ
 */
export function isValidCnpj(cnpj: string): boolean {
  const clean = onlyNumbers(cnpj);
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean.charAt(i)) * weights1[i];
  }
  let rev = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev !== parseInt(clean.charAt(12))) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean.charAt(i)) * weights2[i];
  }
  rev = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rev !== parseInt(clean.charAt(13))) return false;

  return true;
}

/**
 * Validação genérica de Documento (aceita CPF válido ou CNPJ válido)
 */
export function validateCpfCnpj(value: string): { isValid: boolean; message?: string } {
  const clean = onlyNumbers(value);
  if (!clean) {
    return { isValid: false, message: "Documento obrigatório." };
  }
  if (clean.length < 11) {
    return { isValid: false, message: "Documento incompleto." };
  }
  if (clean.length === 11) {
    return isValidCpf(clean)
      ? { isValid: true }
      : { isValid: false, message: "CPF inválido. Verifique os dígitos digitados." };
  }
  if (clean.length === 14) {
    return isValidCnpj(clean)
      ? { isValid: true }
      : { isValid: false, message: "CNPJ inválido. Verifique os dígitos digitados." };
  }
  return { isValid: false, message: "Documento deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ)." };
}

/**
 * Máscara dinâmica para Telefone Celular ou Fixo:
 * Celular: (00) 00000-0000 | Fixo: (00) 0000-0000
 */
export function maskPhone(value: string | null | undefined): string {
  const digits = onlyNumbers(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/**
 * Validação de Telefone / WhatsApp
 */
export function validatePhone(phone: string): { isValid: boolean; message?: string } {
  const clean = onlyNumbers(phone);
  if (!clean) {
    return { isValid: false, message: "Telefone obrigatório." };
  }
  if (clean.length < 10) {
    return { isValid: false, message: "Telefone incompleto. Inclua o DDD (ex: (11) 98888-7766)." };
  }
  if (clean.length > 11) {
    return { isValid: false, message: "Telefone não pode ter mais de 11 dígitos com DDD." };
  }
  // Valida DDD brasileiro (11 a 99)
  const ddd = parseInt(clean.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { isValid: false, message: "DDD inválido." };
  }
  return { isValid: true };
}

/**
 * Máscara de CEP: 00000-000
 */
export function maskCep(value: string | null | undefined): string {
  const digits = onlyNumbers(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

/**
 * Validação de CEP
 */
export function validateCep(cep: string): { isValid: boolean; message?: string } {
  const clean = onlyNumbers(cep);
  if (clean.length !== 8) {
    return { isValid: false, message: "CEP deve conter exatamente 8 dígitos." };
  }
  return { isValid: true };
}

/**
 * Formata número como percentual amigável (ex: 15.5%)
 */
export function formatPercent(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  return `${num.toFixed(1).replace(/\.0$/, "")}%`;
}
