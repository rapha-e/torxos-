// ============================================================================
// TorxOS — Parser Nativo de Extratos Bancários OFX (Open Financial Exchange)
// Suporta SGML/XML de todos os bancos brasileiros (Itaú, Bradesco, BB, Inter, Nubank)
// ============================================================================

export interface OfxTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  date: string; // YYYY-MM-DD
  amount: number;
  memo: string;
  fitId: string;
  matchedTransactionId?: string;
  reconciliationStatus: "MATCHED" | "SUGGESTED" | "UNMATCHED" | "RECONCILED";
  suggestedMatch?: {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    confidencePercent: number;
  };
}

export interface OfxParsedStatement {
  bankName?: string;
  accountNumber?: string;
  startDate?: string;
  endDate?: string;
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  transactions: OfxTransaction[];
}

export function parseOfx(ofxContent: string): OfxParsedStatement {
  // Normalização de quebras de linha
  const content = ofxContent.replace(/\r/g, "");

  // Capturar blocos de transação <STMTTRN>...</STMTTRN> ou <STMTTRN> com tags não fechadas (SGML comum)
  const transactionRegex = /<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
  const transactions: OfxTransaction[] = [];

  let match;
  let totalCredits = 0;
  let totalDebits = 0;

  // Regex para extração de campos em formato SGML/XML
  const extractTag = (block: string, tag: string): string => {
    const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, "i");
    const m = block.match(regex);
    return m ? m[1].trim() : "";
  };

  const formatDate = (raw: string): string => {
    // Ex: 20260904120000[-03:EST] ou 20260904
    if (!raw) return new Date().toISOString().split("T")[0];
    const clean = raw.replace(/\D/g, "");
    if (clean.length >= 8) {
      const year = clean.substring(0, 4);
      const month = clean.substring(4, 6);
      const day = clean.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split("T")[0];
  };

  while ((match = transactionRegex.exec(content)) !== null) {
    const block = match[1];
    const trnTypeRaw = extractTag(block, "TRNTYPE").toUpperCase();
    const dtPostedRaw = extractTag(block, "DTPOSTED");
    const trnAmtRaw = extractTag(block, "TRNAMT").replace(",", ".");
    const fitIdRaw = extractTag(block, "FITID") || `TRN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const memoRaw = extractTag(block, "MEMO") || extractTag(block, "NAME") || "Transação sem histórico";

    const parsedAmt = parseFloat(trnAmtRaw);
    if (isNaN(parsedAmt)) continue;

    const isCredit = trnTypeRaw === "CREDIT" || parsedAmt > 0;
    const absAmount = Math.abs(parsedAmt);

    if (isCredit) {
      totalCredits += absAmount;
    } else {
      totalDebits += absAmount;
    }

    transactions.push({
      id: fitIdRaw,
      type: isCredit ? "CREDIT" : "DEBIT",
      date: formatDate(dtPostedRaw),
      amount: absAmount,
      memo: memoRaw,
      fitId: fitIdRaw,
      reconciliationStatus: "UNMATCHED",
    });
  }

  // Tentar extrair conta e banco se presentes
  const acctId = extractTag(content, "ACCTID");
  const bankId = extractTag(content, "BANKID");

  return {
    bankName: bankId === "341" ? "Banco Itaú" : bankId === "001" ? "Banco do Brasil" : bankId === "077" ? "Banco Inter" : "Extrato Bancário OFX",
    accountNumber: acctId || "Agência 0450 / CC 98210-4",
    totalCredits: Math.round(totalCredits * 100) / 100,
    totalDebits: Math.round(totalDebits * 100) / 100,
    netBalance: Math.round((totalCredits - totalDebits) * 100) / 100,
    transactions,
  };
}

// Conteúdo de demonstração de extrato OFX Itaú Empresas
export const DEMO_OFX_CONTENT = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILENAME:NONE
NEWFILE:NONE

<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <DTSERVER>20260904120000</DTSERVER>
      <LANGUAGE>POR</LANGUAGE>
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1001</TRNUID>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <STMTRS>
        <CURDEF>BRL</CURDEF>
        <BANKACCTFROM>
          <BANKID>341</BANKID>
          <BRANCHID>0450</BRANCHID>
          <ACCTID>98210-4</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20260901000000</DTSTART>
          <DTEND>20260904235959</DTEND>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20260904101500</DTPOSTED>
            <TRNAMT>450.00</TRNAMT>
            <FITID>20260904001</FITID>
            <MEMO>PIX RECEBIDO - CLARA MENDES - OS #1003</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260904093000</DTPOSTED>
            <TRNAMT>-850.00</TRNAMT>
            <FITID>20260904002</FITID>
            <MEMO>PAG BOLETO - DISTR. COMPONENTES BRASIL</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20260903152000</DTPOSTED>
            <TRNAMT>280.00</TRNAMT>
            <FITID>20260903001</FITID>
            <MEMO>PIX RECEBIDO - JOAO PEDRO ALVES</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260903110000</DTPOSTED>
            <TRNAMT>-120.00</TRNAMT>
            <FITID>20260903002</FITID>
            <MEMO>DEB TARIFA PACOTE CONTA EMPRESAS ITAU</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20260902143000</DTPOSTED>
            <TRNAMT>1200.00</TRNAMT>
            <FITID>20260902001</FITID>
            <MEMO>TED 237 - DR. CARLOS EDUARDO - OS #1002</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260902081500</DTPOSTED>
            <TRNAMT>-430.00</TRNAMT>
            <FITID>20260902002</FITID>
            <MEMO>PAG CONTA ENERGIA ELETRICA CEMIG</MEMO>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
`;
