// ============================================================================
// TorxOS — Gerador Oficial de PIX Dinâmico (Padrão Banco Central / EMVCo BR Code)
// Gera payload compatível com "Pix Copia e Cola" e QRCodes estáticos/dinâmicos. 0x1021)
// ============================================================================

export interface PixChargeParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txId?: string;
  description?: string;
}

export interface PixChargeResult {
  brCode: string;
  qrCodeUrl: string;
  txId: string;
  amount: number;
  formattedAmount: string;
  pixKey: string;
  merchantName: string;
}

// Normaliza texto removendo caracteres especiais e acentos
function sanitizeText(str: string, maxLength: number): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .substring(0, maxLength);
}

// Formata campos no padrão TLV (Tag, Length, Value)
function formatTlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// Algoritmo CRC16 CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
function calculateCrc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixBrCode(params: PixChargeParams): PixChargeResult {
  const {
    pixKey,
    merchantName = "TORXOS TECH",
    merchantCity = "SAO PAULO",
    amount,
    txId = `OS${Date.now().toString().slice(-6)}`,
    description,
  } = params;

  const cleanName = sanitizeText(merchantName, 25) || "TORXOS TECH";
  const cleanCity = sanitizeText(merchantCity, 15) || "SAO PAULO";
  const cleanTxId = sanitizeText(txId, 25) || "***";
  const formattedAmount = amount.toFixed(2);

  // 1. Tag 26: Merchant Account Information
  let merchantAccountInfo = formatTlv("00", "br.gov.bcb.pix") + formatTlv("01", pixKey.trim());
  if (description) {
    merchantAccountInfo += formatTlv("02", sanitizeText(description, 40));
  }

  // 2. Tag 62: Additional Data Field (TxID)
  const additionalData = formatTlv("05", cleanTxId);

  // 3. Montagem do payload EMVCo base
  let payload =
    formatTlv("00", "01") + // Payload Format Indicator
    formatTlv("26", merchantAccountInfo) +
    formatTlv("52", "0000") + // Merchant Category Code
    formatTlv("53", "986") + // Moeda Real BRL
    formatTlv("54", formattedAmount) + // Valor da transação
    formatTlv("58", "BR") + // País
    formatTlv("59", cleanName) + // Nome do Recebedor
    formatTlv("60", cleanCity) + // Cidade
    formatTlv("62", additionalData); // TxId

  // 4. Tag 63: CRC16 com 4 caracteres
  payload += "6304";
  const crc = calculateCrc16(payload);
  const completeBrCode = `${payload}${crc}`;

  return {
    brCode: completeBrCode,
    qrCodeUrl: completeBrCode,
    txId: cleanTxId,
    amount,
    formattedAmount: `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    pixKey,
    merchantName: cleanName,
  };
}
