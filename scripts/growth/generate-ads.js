#!/usr/bin/env node

/**
 * TorxOS Growth Engine — Gerador Autônomo de Copys & Campanhas de Tráfego Pago
 * 
 * Execução direta sem compilação:
 * node scripts/growth/generate-ads.js --focus=ESTOQUE
 * node scripts/growth/generate-ads.js --focus=OS_WHATSAPP
 * node scripts/growth/generate-ads.js --focus=FINANCEIRO_DRE
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=")[1] : fallback;
};

const focus = getArg("focus", "GERAL").toUpperCase();
const count = parseInt(getArg("count", "3"), 10);

console.log("==========================================================");
console.log("🚀 TORXOS GROWTH ENGINE — GERADOR DE TRÁFEGO PAGO & COPYS");
console.log("==========================================================");
console.log(`📌 Foco Temático: ${focus}`);
console.log(`📌 Quantidade de Variações: ${count}`);
console.log(`📌 Data de Execução: ${new Date().toLocaleString("pt-BR")}`);
console.log("----------------------------------------------------------\n");

const adsDatabase = {
  ESTOQUE: [
    {
      framework: "PAS (Problema - Agitação - Solução)",
      angle: "Peças que Somem & Falta de Telas",
      hook: "🚨 Quantas telas e baterias já sumiram na sua oficina sem ninguém saber quem pegou?",
      primaryText:
        "Se você tem assistência técnica, já passou pela vergonha de prometer o aparelho para as 18h e, na hora de fechar a carcaça, descobrir que a peça não estava na gaveta.\n\n" +
        "Além de passar vergonha com o cliente, você perdeu a venda e o lucro daquele dia.\n\n" +
        "Com o TorxOS, cada peça só sai do estoque vinculada ao número da OS. O sistema dá baixa automática, calcula sua margem real e te avisa antes da peça acabar.\n\n" +
        "✅ Teste grátis por 7 dias sem precisar de cartão de crédito!",
      headline: "Controle de Peças para Assistência Técnica • Teste Grátis",
      cta: "Cadastre-se Grátis",
      url: "https://app.torxos.com.br/lp?utm_source=meta&utm_medium=feed&utm_campaign=estoque_pas",
    },
  ],
  OS_WHATSAPP: [
    {
      framework: "AIDA (Atenção - Interesse - Desejo - Ação)",
      angle: "Cliente Cobrando Status no WhatsApp",
      hook: "📱 Pare de passar o dia inteiro respondendo 'já ficou pronto?' no WhatsApp!",
      primaryText:
        "Você sabia que um técnico perde em média 1h30 por dia apenas procurando aparelhos na bancada para responder clientes impacientes?\n\n" +
        "Com o TorxOS, na hora da entrada você imprime a etiqueta com QR Code para colar no celular. O cliente aponta a câmera e vê as fotos do conserto e o status em tempo real.\n\n" +
        "Resultado: menos mensagens no WhatsApp, mais foco na bancada e orçamentos aprovados com 1 clique.\n\n" +
        "🚀 Comece seus 7 dias de teste grátis agora mesmo!",
      headline: "OS no WhatsApp com QR Code • Sistema TorxOS",
      cta: "Começar Teste Grátis",
      url: "https://app.torxos.com.br/lp?utm_source=meta&utm_medium=feed&utm_campaign=os_whatsapp",
    },
  ],
  FINANCEIRO_DRE: [
    {
      framework: "DIRECT_RESPONSE",
      angle: "Bancada Cheia e Bolso Vazio",
      hook: "💰 Bancada entupida de aparelhos, mas no fim do mês cadê o lucro da oficina?",
      primaryText:
        "Se a sua assistência técnica não tem um DRE automático, você pode estar pagando para trabalhar sem perceber.\n\n" +
        "Custo da peça, imposto, garantia, comissão do técnico e conta de luz: se não colocar isso na ponta do lápis, o prejuízo é certo.\n\n" +
        "O TorxOS é o único sistema que te mostra no centavo o lucro líquido de cada ordem de serviço e da oficina inteira.\n\n" +
        "🎁 Crie sua conta grátis em 1 minuto sem cartão de crédito.",
      headline: "Controle Financeiro para Assistência • TorxOS Pro",
      cta: "Testar Grátis",
      url: "https://app.torxos.com.br/lp?utm_source=meta&utm_medium=feed&utm_campaign=financeiro_dre",
    },
  ],
};

const selectedAds = adsDatabase[focus] || [
  ...adsDatabase.ESTOQUE,
  ...adsDatabase.OS_WHATSAPP,
  ...adsDatabase.FINANCEIRO_DRE,
];

const googleSearchCampaign = {
  campaign: "Google Search • Fundo de Funil • TorxOS SaaS",
  headlines: [
    "Sistema para Assistência",
    "Programa Ordem de Serviço",
    "TorxOS • Teste 7 Dias Grátis",
    "Software Oficina Celular",
    "Gestão Completa de Bancada",
  ],
  descriptions: [
    "Elimine o caderno e controle ordens de serviço, estoque e caixa. Teste 7 dias grátis!",
    "Envio de OS por WhatsApp, QR Code no aparelho e alerta de estoque com Inteligência Artificial.",
  ],
  keywords: [
    '"sistema para assistencia tecnica"',
    "[software para assistencia tecnica de celulares]",
    '"programa ordem de servico celular"',
    '"software gestao oficina celular gratis"',
  ],
  finalUrl: "https://app.torxos.com.br/lp?utm_source=google&utm_medium=search",
};

console.log("📋 COPIES GERADAS PARA META ADS (FEED & STORIES):");
selectedAds.forEach((ad, i) => {
  console.log(`\n--- ANÚNCIO ${i + 1} [${ad.angle}] ---`);
  console.log(`🎯 Hook: ${ad.hook}`);
  console.log(`📝 Texto Principal:\n${ad.primaryText}`);
  console.log(`📌 Headline: ${ad.headline}`);
  console.log(`🔗 CTA: ${ad.cta} | URL: ${ad.url}`);
});

console.log("\n==========================================================");
console.log("🔍 CAMPANHA DE GOOGLE ADS SEARCH:");
console.log("Headlines:", googleSearchCampaign.headlines.join(" | "));
console.log("Descriptions:", googleSearchCampaign.descriptions.join(" // "));
console.log("Palavras-chave:", googleSearchCampaign.keywords.join(", "));
console.log("==========================================================\n");

const outputDir = path.resolve(__dirname, "../../content/ads");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const jsonFile = path.join(outputDir, `campanha_${focus.toLowerCase()}_${timestamp}.json`);
const mdFile = path.join(outputDir, `campanha_${focus.toLowerCase()}_${timestamp}.md`);

const outputData = {
  executedAt: new Date().toISOString(),
  focus,
  selectedAds,
  googleSearchCampaign,
};

fs.writeFileSync(jsonFile, JSON.stringify(outputData, null, 2), "utf-8");

let mdContent = `# Campanhas de Tráfego Pago — TorxOS\n\n`;
mdContent += `**Data:** ${new Date().toLocaleString("pt-BR")}\n`;
mdContent += `**Foco:** ${focus}\n\n`;
mdContent += `## Anúncios para Meta Ads (Feed & Instagram)\n\n`;
selectedAds.forEach((ad, i) => {
  mdContent += `### Anúncio ${i + 1}: ${ad.angle}\n\n`;
  mdContent += `**Framework:** ${ad.framework}\n\n`;
  mdContent += `**Gancho:** ${ad.hook}\n\n`;
  mdContent += `**Texto Principal:**\n\n${ad.primaryText}\n\n`;
  mdContent += `**Headline:** ${ad.headline}\n\n`;
  mdContent += `**Link de Destino:** [${ad.url}](${ad.url})\n\n---\n\n`;
});

fs.writeFileSync(mdFile, mdContent, "utf-8");

console.log(`✅ Arquivos gerados e salvos com sucesso:`);
console.log(`📁 ${jsonFile}`);
console.log(`📁 ${mdFile}`);
console.log("\n🎯 Pronto para subir nos gerenciadores de anúncios!");
