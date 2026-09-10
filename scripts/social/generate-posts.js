/**
 * Script Autônomo de Geração e Agendamento de Postagens para Redes Sociais — TorxOS
 * 
 * Uso:
 *   node scripts/social/generate-posts.js --week
 *   node scripts/social/generate-posts.js --pillar=GESTAO_OFICINA --count=1
 *   node scripts/social/generate-posts.js --pillar=BANCADA_TECNICA
 */

const fs = require("fs");
const path = require("path");

// Diretório de saída
const OUTPUT_DIR = path.join(__dirname, "../../content/social/posts");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Parse de argumentos simples da CLI
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith("--")) {
    const [key, val] = arg.replace(/^--/, "").split("=");
    acc[key] = val || true;
  }
  return acc;
}, {});

const isWeekly = args.week || false;
const requestedPillar = (args.pillar || "GESTAO_OFICINA").toUpperCase();

// Banco de pautas educativas especializadas no nicho
const topics = {
  BANCADA_TECNICA: [
    {
      title: "3 Erros na Bancada que Queimam a Placa do Cliente",
      subtitle: "O segundo erro quase todo técnico já cometeu pelo menos uma vez.",
      points: [
        "1. Tensão Excessiva na Fonte: Injetar voltagem sem antes verificar a linha primária VDD_MAIN.",
        "2. Fluxo de Solda Condutivo: Não limpar resíduos de fluxo que oxidam trilhas microscópicas.",
        "3. Desconectar Bateria por Último: Manter energia residual antes de desconectar flex de tela ou câmeras.",
      ],
      ctaText: "Organize seus laudos técnicos e checklists fotográficos com o TorxOS. Teste 7 dias grátis no link da bio!",
    },
    {
      title: "Como Identificar Curto Primário Sem Fritar a Placa",
      subtitle: "O método do breu e da câmera térmica para achar o componente culpado em minutos.",
      points: [
        "Passo 1: Meça a impedância da linha VDD_MAIN com o multímetro em escala de diodo.",
        "Passo 2: Isole o circuito e aplique fumaça de breu ou use detector de curto.",
        "Passo 3: Injete 1.2V com corrente de 1.5A na linha secundária e veja o capacitor aquecer.",
        "Passo 4: Remova o capacitor em curto e meça novamente antes de fechar o aparelho.",
      ],
      ctaText: "Anote o laudo técnico completo e histórico de peças de cada cliente no TorxOS. Teste grátis!",
    },
  ],
  GESTAO_OFICINA: [
    {
      title: "A Matemática da Troca de Tela: Quanto Realmente Sobra?",
      subtitle: "Cobrar R$ 250 numa tela que custou R$ 130 não significa que você lucrou R$ 120.",
      points: [
        "Peça de Reposição: R$ 130,00 (Custo direto da tela)",
        "Impostos e Taxa de Cartão (4%): R$ 10,00",
        "Reserva Técnica de Garantia (10%): R$ 13,00 para eventuais quebras",
        "Custo Fixo por Hora de Bancada: R$ 35,00 (aluguel, luz, sistema)",
        "Lucro Líquido Real: R$ 62,00. Se quebrar uma tela na montagem, você trabalha de graça o dia todo.",
      ],
      ctaText: "O TorxOS calcula o custo da peça, margem líquida e DRE da sua assistência técnica em tempo real. Teste grátis no link da bio!",
    },
    {
      title: "5 Sinais de que Sua Assistência Técnica Está Sangrando Dinheiro",
      subtitle: "Você trabalha até 20h da noite, a bancada tá cheia de celular, mas no fim do mês falta dinheiro?",
      points: [
        "1. Ninguém sabe onde foi parar a tela do Moto G22 comprada semana passada.",
        "2. Cliente volta reclamando de bateria e você não sabe se a peça tinha garantia ou não.",
        "3. Descontos no balcão dados no 'olhômetro' sem consultar o custo real.",
        "4. Gastos pessoais do dono misturados na conta da loja (retiradas desordenadas).",
        "5. Ordens de serviço perdidas em bloquinhos de papel rasurados.",
      ],
      ctaText: "Assuma o controle total do estoque, finanças e WhatsApp da sua assistência técnica com o TorxOS. 7 dias grátis no link da bio!",
    },
  ],
  ATENDIMENTO_CLIENTE: [
    {
      title: "Como Acabar com as Mensagens 'Já tá pronto?' no WhatsApp",
      subtitle: "O atendimento via WhatsApp consome até 2 horas por dia de bancada de um técnico.",
      points: [
        "O Problema: O cliente fica ansioso porque não sabe em qual etapa o celular está.",
        "A Solução: Enviar um link de rastreamento online assim que a OS é aberta.",
        "Status em Tempo Real: 'Aguardando Peça' -> 'Em Manutenção' -> 'Testes Finais' -> 'Pronto para Retirada'.",
        "Resultado: 80% menos mensagens no WhatsApp e cliente encantado com o profissionalismo.",
      ],
      ctaText: "O TorxOS gera link de acompanhamento para o cliente ver o status pelo celular sem te interromper. Teste grátis!",
    },
  ],
  PRODUTIVIDADE_SISTEMA: [
    {
      title: "3 Vantagens Brutais de Trocar o Caderno de Papel por um Sistema",
      subtitle: "Se sua assistência ainda anota OS em talãozinho de papel, você está arriscando seu lucro.",
      points: [
        "1. Busca em 3 Segundos: Ache qualquer cliente pelo nome, CPF ou número da OS sem revirar gaveta.",
        "2. Controle de Estoque Automático: A peça sai da OS e já é baixada do inventário na mesma hora.",
        "3. Impressão Térmica Profissional: Entregue um comprovante bonito com QR Code de garantia.",
      ],
      ctaText: "Dê o salto profissional que sua assistência técnica merece. Acesse o link da bio e use o TorxOS grátis por 7 dias!",
    },
  ],
};

function renderSvg(title, subtitle, bullets, current, total, badge, footer, isCover, isCta) {
  function escapeXml(unsafe) {
    return String(unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function wrapSvgText(text, maxChars) {
    const words = String(text || "").split(" ");
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length <= maxChars) {
        cur = (cur + " " + w).trim();
      } else {
        lines.push(cur);
      }
    });
    if (cur) lines.push(cur);
    return lines
      .map((l, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : '1.25em'}">${escapeXml(l)}</tspan>`)
      .join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0B0C"/>
      <stop offset="50%" stop-color="#121214"/>
      <stop offset="100%" stop-color="#18181B"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bgGrad)"/>
  <rect x="40" y="40" width="1000" height="1000" rx="32" fill="none" stroke="#27272A" stroke-width="2"/>
  
  <!-- Top Bar -->
  <g transform="translate(80, 100)">
    <!-- Mini Logo TorxOS -->
    <path d="M 0,-14 L 10,-8 L 10,4 L 0,10 L -10,4 L -10,-8 Z" fill="url(#goldGrad)" transform="translate(14, 0) scale(1.2)"/>
    <text x="40" y="5" font-family="'Inter', -apple-system, sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" letter-spacing="3">TORX<tspan fill="#F59E0B">OS</tspan></text>
    <text x="210" y="5" font-family="'Inter', -apple-system, sans-serif" font-size="16" font-weight="500" fill="#71717A">| SISTEMAS</text>
    <text x="920" y="5" text-anchor="end" font-family="'Inter', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#A1A1AA">${current} / ${total}</text>
  </g>

  <!-- Tag Pill -->
  <g transform="translate(80, 180)">
    <rect width="280" height="42" rx="10" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>
    <text x="140" y="27" text-anchor="middle" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="800" fill="#FBBF24" letter-spacing="1.5">${escapeXml(badge)}</text>
  </g>

  <!-- Title -->
  <g transform="translate(80, ${isCover ? 340 : 290})">
    <text x="0" y="0" font-family="'Inter', -apple-system, sans-serif" font-size="${isCover ? 56 : 44}" font-weight="900" fill="#FFFFFF">
      ${wrapSvgText(title, isCover ? 28 : 34)}
    </text>
  </g>

  <!-- Subtitle -->
  <g transform="translate(80, ${isCover ? 600 : 540})">
    <text x="0" y="0" font-family="'Inter', -apple-system, sans-serif" font-size="${isCover ? 28 : 25}" font-weight="400" fill="#A1A1AA">
      ${wrapSvgText(subtitle || "", 46)}
    </text>
  </g>

  <!-- Bullets -->
  ${
    bullets && bullets.length > 0
      ? `<g transform="translate(80, 680)">
    ${bullets
      .map(
        (b, i) => `
      <g transform="translate(0, ${i * 65})">
        <circle cx="10" cy="-6" r="6" fill="#F59E0B"/>
        <text x="32" y="0" font-family="'Inter', -apple-system, sans-serif" font-size="23" font-weight="500" fill="#E4E4E7">
          ${escapeXml(b)}
        </text>
      </g>`
      )
      .join("")}
  </g>`
      : ""
  }

  <!-- Footer Divider & Account Info -->
  <line x1="80" y1="940" x2="1000" y2="940" stroke="#27272A" stroke-width="1.5"/>
  <g transform="translate(80, 990)">
    <text x="0" y="0" font-family="'Inter', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#FBBF24">${escapeXml(footer)}</text>
    <text x="920" y="0" text-anchor="end" font-family="'Inter', -apple-system, sans-serif" font-size="18" font-weight="600" fill="#A1A1AA">@torxos.oficial</text>
  </g>
</svg>`;
}

function generatePost(pillar, index = 1) {
  const list = topics[pillar] || topics.GESTAO_OFICINA;
  const base = list[Math.floor(Math.random() * list.length)];
  const totalSlides = 6;
  const slides = [];

  // Slide 1: Cover
  const coverSvg = renderSvg(
    base.title,
    base.subtitle,
    null,
    1,
    totalSlides,
    pillar.replace("_", " "),
    "Arraste para o lado 👉",
    true,
    false
  );
  slides.push({
    slideNumber: 1,
    title: base.title,
    subtitle: base.subtitle,
    svg: coverSvg,
  });

  // Slides 2 a 5: Conteúdo
  for (let i = 0; i < 4; i++) {
    const point = base.points[i % base.points.length];
    const parts = point.split(":");
    const header = parts[0] || `Dica #${i + 1}`;
    const detail = parts.slice(1).join(":").trim() || point;

    const slideSvg = renderSvg(
      header,
      detail,
      ["Aplique esse passo na sua bancada hoje mesmo.", "Evite retrabalho e prejuízos com garantia."],
      i + 2,
      totalSlides,
      `PASSO 0${i + 1}`,
      "TorxOS • Gestão de Assistência",
      false,
      false
    );
    slides.push({
      slideNumber: i + 2,
      title: header,
      subtitle: detail,
      svg: slideSvg,
    });
  }

  // Slide 6: CTA
  const ctaSvg = renderSvg(
    "Gostou desse conteúdo?",
    "Chega de perder dinheiro com papel e falta de controle. Conheça o TorxOS e profissionalize sua assistência técnica.",
    [
      "✅ Ordens de serviço digitais com fotos",
      "✅ Notificação automática de status no WhatsApp",
      "✅ Controle de peças e estoque sem sumiço",
    ],
    totalSlides,
    totalSlides,
    "TRANSFORME SUA ASSISTÊNCIA",
    "👉 Teste 7 dias grátis no link da bio!",
    false,
    true
  );
  slides.push({
    slideNumber: totalSlides,
    title: "Gostou desse conteúdo?",
    subtitle: "Conheça o TorxOS.",
    svg: ctaSvg,
  });

  const caption = `🔥 ${base.title}

${base.subtitle}

Se você trabalha com conserto de celulares ou computadores, salva esse carrossel para consultar na sua bancada! 📌

👇 O que vimos nesse post:
${base.points.map((p) => `• ${p}`).join("\n")}

💡 ${base.ctaText}

💬 Qual é a maior dificuldade na sua bancada hoje? Comenta aqui embaixo!
🚀 Compartilha com aquele amigo técnico que precisa organizar a assistência técnica.

.
.
#assistenciatecnica #consertodecelular #gestaodeassistencia #tecnicoemcelular #microsoldagem #lojadegelular #torxos #torxosoficial`;

  return {
    id: `post_${Date.now()}_${index}`,
    pillar,
    title: base.title,
    caption,
    slides,
  };
}

// Execução
console.log("\n========================================================");
console.log("  🚀 TORXOS SOCIAL ENGINE — GERAÇÃO DE POSTS & CARROSSÉIS");
console.log("========================================================\n");

const postsToGenerate = isWeekly
  ? [
      { day: "Segunda", pillar: "BANCADA_TECNICA" },
      { day: "Quarta", pillar: "GESTAO_OFICINA" },
      { day: "Sexta", pillar: "ATENDIMENTO_CLIENTE" },
    ]
  : [{ day: "Hoje", pillar: requestedPillar }];

const generatedPosts = [];
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const subDirName = isWeekly ? `weekly_pack_${timestamp}` : `post_${requestedPillar}_${timestamp}`;
const postTargetDir = path.join(OUTPUT_DIR, subDirName);
fs.mkdirSync(postTargetDir, { recursive: true });

postsToGenerate.forEach((item, idx) => {
  const post = generatePost(item.pillar, idx + 1);
  post.day = item.day;
  generatedPosts.push(post);

  // Salva SVGs de cada slide
  post.slides.forEach((s) => {
    const svgFileName = `post_${idx + 1}_${item.day}_slide_${s.slideNumber}.svg`;
    fs.writeFileSync(path.join(postTargetDir, svgFileName), s.svg, "utf-8");
  });

  // Salva legenda individual em .txt
  const captionFileName = `post_${idx + 1}_${item.day}_legenda.txt`;
  fs.writeFileSync(path.join(postTargetDir, captionFileName), post.caption, "utf-8");

  console.log(`✅ [${item.day}] Carrossel Gerado: "${post.title}" (${post.slides.length} slides salvos em SVG)`);
});

// Salva resumo em JSON
fs.writeFileSync(
  path.join(postTargetDir, "posts_metadata.json"),
  JSON.stringify(generatedPosts, null, 2),
  "utf-8"
);

// Salva relatório em Markdown para leitura amigável
let mdContent = `# Grade de Postagens TorxOS (${subDirName})\n\n`;
generatedPosts.forEach((p, idx) => {
  mdContent += `## Post #${idx + 1} (${p.day}) — ${p.title}\n\n`;
  mdContent += `**Pilar:** \`${p.pillar}\`\n\n`;
  mdContent += `### 📝 Legenda do Instagram:\n\`\`\`\n${p.caption}\n\`\`\`\n\n`;
  mdContent += `### 🎨 Slides Salvos em SVG:\n`;
  p.slides.forEach((s) => {
    mdContent += `- Slide ${s.slideNumber}: \`${s.title}\`\n`;
  });
  mdContent += `\n---\n\n`;
});
fs.writeFileSync(path.join(postTargetDir, "README.md"), mdContent, "utf-8");

console.log(`\n📁 Arquivos e artes gerados com sucesso em:\n   ${postTargetDir}`);
console.log("✨ Tudo pronto para publicar no Instagram ou agendar via Antigravity /schedule!\n");
