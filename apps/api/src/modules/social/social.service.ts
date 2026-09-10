import { Injectable, Logger } from "@nestjs/common";
import sharp from "sharp";
import {
  GenerateCarouselDto,
  GenerateWeeklyPackDto,
  PublishWebhookDto,
  SocialPillar,
  SocialTone,
} from "./dto/social.dto";

export interface CarouselSlide {
  slideNumber: number;
  type: "COVER" | "CONTENT" | "CTA";
  badge: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  footer: string;
  svgCode?: string;
  imageUrl?: string;
}

export interface GeneratedSocialPost {
  id: string;
  pillar: SocialPillar;
  title: string;
  format: "CAROUSEL" | "SINGLE_IMAGE";
  caption: string;
  hashtags: string[];
  suggestedScheduleDay: string;
  slides: CarouselSlide[];
  imageUrl?: string;
  createdAt: string;
}

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  // Banco de pautas e templates especializados para o nicho de assistência técnica de celulares
  private readonly topicsDatabase = {
    [SocialPillar.BANCADA_TECNICA]: [
      {
        title: "3 Erros Comuns na Bancada que Queimam a Placa do Cliente",
        subtitle: "O segundo erro quase todo técnico iniciante já cometeu pelo menos uma vez.",
        points: [
          "1. Tensão Excessiva na Fonte: Injetar voltagem sem antes verificar a linha primária VDD_MAIN.",
          "2. Fluxo de Solda Condutivo: Não limpar resíduos de fluxo que oxidam trilhas microscópicas.",
          "3. Desconectar Bateria por Último: Manter energia residual antes de desconectar flex de tela ou câmeras.",
        ],
        ctaText: "Quer profissionalizar sua bancada e evitar prejuízos com garantia? O TorxOS organiza suas ordens de serviço com fotos do antes e depois. Teste 7 dias grátis no link da bio!",
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
        ctaText: "Anote o laudo técnico completo e histórico de peças de cada cliente no TorxOS. Teste 7 dias grátis!",
      },
    ],
    [SocialPillar.GESTAO_ASSISTENCIA]: [
      {
        title: "A Matemática da Troca de Tela: Quanto Realmente Sobra?",
        subtitle: "Cobrar R$ 250 numa tela que custou R$ 130 não significa que você lucrou R$ 120.",
        points: [
          "Peça de Reposição: R$ 130,00 (Custo direto)",
          "Impostos e Taxa de Cartão (4%): R$ 10,00",
          "Reserva Técnica de Garantia (10%): R$ 13,00 para cobrir eventuais falhas",
          "Custo Fixo por Hora de Bancada: R$ 35,00 (aluguel, luz, sistema)",
          "Lucro Líquido Real: R$ 62,00. Se quebrar uma tela na montagem, você trabalha de graça o dia todo.",
        ],
        ctaText: "O TorxOS calcula o custo da peça, margem líquida e DRE da sua assistência técnica em tempo real. Pare de ter ilusão de faturamento. Teste grátis no link da bio!",
      },
      {
        title: "5 Sinais de que Sua Assistência Técnica Está Sangrando Dinheiro",
        subtitle: "Você trabalha até 20h da noite, a assistência tá cheia de aparelhos, mas no fim do mês falta dinheiro?",
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
    [SocialPillar.ATENDIMENTO_CLIENTE]: [
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
      {
        title: "Por que Tirar Fotos do Aparelho na Entrada Salva Sua Loja",
        subtitle: "Aquele risco na tampa traseira já estava lá ou foi feito na sua bancada?",
        points: [
          "Cenário Clássico: O cliente deixa o celular para trocar conector e diz que a tela não tinha mancha.",
          "A Defesa: Checklist de entrada com fotos dos 4 lados do aparelho salvas na OS.",
          "Assinatura Digital: Termo de vistoria com concordância do estado estético.",
          "Tranquilidade: Zero dor de cabeça e respaldo jurídico contra clientes mal-intencionados.",
        ],
        ctaText: "No TorxOS você anexa fotos da entrada e fotos do reparo concluído direto pelo celular. Experimente 7 dias grátis!",
      },
    ],
    [SocialPillar.PRODUTIVIDADE_SISTEMA]: [
      {
        title: "3 Vantagens Brutais de Trocar o Caderno de Papel por um Sistema",
        subtitle: "Se sua assistência ainda anota OS em talãozinho de papel, você está preso em 2010.",
        points: [
          "1. Busca em 3 Segundos: Ache qualquer cliente pelo nome, CPF ou número da OS sem revirar gaveta.",
          "2. Controle de Estoque Automático: A peça sai da OS e já é baixada do inventário na mesma hora.",
          "3. Impressão Térmica Profissional: Entregue um comprovante bonito com QR Code de garantia.",
        ],
        ctaText: "Dê o salto profissional que sua assistência técnica merece. Acesse o link da bio e use o TorxOS grátis por 7 dias!",
      },
    ],
  };

  /**
   * Retorna os presets e pilares disponíveis para a interface
   */
  getPresets() {
    return {
      pillars: [
        {
          id: SocialPillar.BANCADA_TECNICA,
          label: "🛠️ Bancada & Técnicas",
          description: "Dicas de microsoldagem, circuitos, defeitos comuns e ferramentas.",
        },
        {
          id: SocialPillar.GESTAO_ASSISTENCIA,
          label: "Gestão & Lucro Real",
          description: "Precificação, margem líquida, corte de custos e controle financeiro.",
        },
        {
          id: SocialPillar.ATENDIMENTO_CLIENTE,
          label: "💬 Atendimento & WhatsApp",
          description: "Fidelização, transparência no status da OS e redução de atritos.",
        },
        {
          id: SocialPillar.PRODUTIVIDADE_SISTEMA,
          label: "⚡ Organização & Sistema",
          description: "Substituição do papel, checklists com fotos e controle de peças.",
        },
      ],
      tones: [
        { id: SocialTone.DIRETO_E_PRATICO, label: "Direto e Prático (Bancada)" },
        { id: SocialTone.MENTOR_PROFISSIONAL, label: "Mentor Profissional (Autoridade)" },
        { id: SocialTone.PROVOCATIVO, label: "Provocativo (Despertador)" },
      ],
      hashtagsNicho: [
        "#assistenciatecnica",
        "#consertodecelular",
        "#trocadetela",
        "#tecnicoemcelular",
        "#microsoldagem",
        "#gestaodeassistencia",
        "#lojadegelular",
        "#reparodeplaca",
        "#bancadatecnica",
        "#torxos",
        "#torxossistemas",
      ],
    };
  }

  /**
   * Gera um carrossel educativo para Instagram com slides formatados e SVG renderizável
   */
  async generateCarousel(dto: GenerateCarouselDto): Promise<GeneratedSocialPost> {
    const pillar = dto.pillar || SocialPillar.GESTAO_ASSISTENCIA;
    const totalSlides = dto.totalSlides || 6;

    // Seleciona ou formula o tema
    const availableTopics = this.topicsDatabase[pillar] || this.topicsDatabase[SocialPillar.GESTAO_ASSISTENCIA];
    const baseTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];

    const title = dto.customTopic || baseTopic.title;
    const subtitle = baseTopic.subtitle;
    const points = baseTopic.points;

    // Constrói os slides
    const slides: CarouselSlide[] = [];

    // SLIDE 1: CAPA (COVER)
    const coverSlide: CarouselSlide = {
      slideNumber: 1,
      type: "COVER",
      badge: this.getPillarBadge(pillar),
      title: title,
      subtitle: subtitle,
      footer: "Arraste para o lado 👉",
    };
    coverSlide.svgCode = this.renderSlideSvg(coverSlide, 1, totalSlides);
    slides.push(coverSlide);

    // SLIDES 2 A (N-1): CONTEÚDO
    const contentCount = totalSlides - 2;
    for (let i = 0; i < contentCount; i++) {
      const pointIndex = i % points.length;
      const pointText = points[pointIndex];
      const parts = pointText.split(":");
      const pointHeader = parts[0] || `Dica #${i + 1}`;
      const pointDetail = parts.slice(1).join(":").trim() || pointText;

      const contentSlide: CarouselSlide = {
        slideNumber: i + 2,
        type: "CONTENT",
        badge: `PASSO 0${i + 1}`,
        title: pointHeader,
        subtitle: pointDetail,
        bullets: [
          "Aplique esse procedimento no dia a dia da sua bancada.",
          "Evite prejuízos e retrabalho com garantia desnecessária.",
        ],
        footer: "TorxOS Sistemas • Gestão de Assistência",
      };
      contentSlide.svgCode = this.renderSlideSvg(contentSlide, i + 2, totalSlides);
      slides.push(contentSlide);
    }

    // SLIDE FINAL: CTA
    const ctaSlide: CarouselSlide = {
      slideNumber: totalSlides,
      type: "CTA",
      badge: "TRANSFORME SUA ASSISTÊNCIA",
      title: "Gostou desse conteúdo?",
      subtitle: "Pare de perder tempo com papel e planilhas confusas. Tenha controle total da sua assistência técnica em um só lugar.",
      bullets: [
        "✅ Ordens de serviço digitais com fotos",
        "✅ Notificação automática de status no WhatsApp",
        "✅ Controle de peças e estoque sem sumiço",
        "✅ DRE e finanças calculadas em tempo real",
      ],
      footer: "👉 Clique no link da bio e teste 7 dias grátis!",
    };
    ctaSlide.svgCode = this.renderSlideSvg(ctaSlide, totalSlides, totalSlides);
    slides.push(ctaSlide);

    // Constrói a legenda completa do post com quebras de linha e hashtags
    const caption = this.buildPostCaption(title, subtitle, points, baseTopic.ctaText, pillar);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://torxos.tech";
    slides.forEach((s) => {
      const bulletsParam = s.bullets && s.bullets.length > 0 ? `&bullets=${encodeURIComponent(JSON.stringify(s.bullets))}` : "";
      s.imageUrl = `${baseUrl}/api/v1/social/render-slide-png?title=${encodeURIComponent(s.title)}&subtitle=${encodeURIComponent(s.subtitle || '')}&badge=${encodeURIComponent(s.badge)}&slide=${s.slideNumber}&total=${totalSlides}&type=${s.type}${bulletsParam}`;
    });

    const mainImageUrl = slides[0]?.imageUrl || `${baseUrl}/api/v1/social/render-slide-png?title=${encodeURIComponent(title)}&slide=1&total=${totalSlides}`;

    return {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      pillar,
      title,
      format: "CAROUSEL",
      caption,
      hashtags: this.getHashtagsForPillar(pillar),
      suggestedScheduleDay: "Quarta-feira às 12:30",
      slides,
      imageUrl: mainImageUrl,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Converte um slide SVG diretamente para imagem PNG 1080x1080 em alta resolução usando Sharp
   */
  async renderSlideToPng(params: {
    title: string;
    subtitle?: string;
    badge?: string;
    slideNumber: number;
    totalSlides: number;
    type?: "COVER" | "CONTENT" | "CTA";
    bullets?: string[];
  }): Promise<Buffer> {
    const slideNumber = Number(params.slideNumber) || 1;
    const totalSlides = Number(params.totalSlides) || 6;
    const slide: CarouselSlide = {
      slideNumber,
      type: params.type || (slideNumber === 1 ? "COVER" : slideNumber === totalSlides ? "CTA" : "CONTENT"),
      badge: params.badge || "DICA DE BANCADA",
      title: params.title || "TorxOS - Gestão de Assistência",
      subtitle: params.subtitle || "",
      bullets: params.bullets,
      footer: slideNumber === 1 ? "Arraste para o lado 👉" : "TorxOS Sistemas • Gestão de Assistência",
    };

    const svgCode = this.renderSlideSvg(slide, slideNumber, totalSlides);
    return sharp(Buffer.from(svgCode), { density: 150 }).png().toBuffer();
  }

  /**
   * Gera pacote semanal de conteúdo (3 posts estratégicos: Seg/Qua/Sex)
   */
  async generateWeeklyPack(dto: GenerateWeeklyPackDto) {
    const days = [
      { day: "Segunda-feira (08:30)", pillar: SocialPillar.BANCADA_TECNICA },
      { day: "Quarta-feira (12:30)", pillar: SocialPillar.GESTAO_ASSISTENCIA },
      { day: "Sexta-feira (18:00)", pillar: SocialPillar.ATENDIMENTO_CLIENTE },
    ];

    const posts: GeneratedSocialPost[] = [];
    const count = dto.postsCount || 3;

    for (let i = 0; i < count; i++) {
      const config = days[i % days.length];
      const post = await this.generateCarousel({
        pillar: config.pillar,
        totalSlides: 6,
        tone: SocialTone.DIRETO_E_PRATICO,
      });
      post.suggestedScheduleDay = config.day;
      posts.push(post);
    }

    return {
      weeklyTheme: dto.weeklyTheme || "Semana da Gestão e Eficiência na Assistência Técnica",
      totalPosts: posts.length,
      posts,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Dispara o webhook para n8n, Make, Buffer ou Zapier
   */
  async dispatchWebhook(dto: PublishWebhookDto) {
    this.logger.log(`Disparando webhook social para: ${dto.webhookUrl}`);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://torxos.tech";
      const totalSlides = dto.postData?.slides?.length || 6;
      const postCaption = dto.postData?.caption || "";

      // Gera e garante URLs dinâmicas dos slides renderizados em PNG pelo Sharp
      const processedSlides = (dto.postData?.slides || []).map((s: any, idx: number) => {
        const num = s.slideNumber || idx + 1;
        const bulletsParam = s.bullets && s.bullets.length > 0 ? `&bullets=${encodeURIComponent(JSON.stringify(s.bullets))}` : "";
        const slideUrl = `${baseUrl}/api/v1/social/render-slide-png?title=${encodeURIComponent(s.title || '')}&subtitle=${encodeURIComponent(s.subtitle || '')}&badge=${encodeURIComponent(s.badge || 'BANCADA & TÉCNICA')}&slide=${num}&total=${totalSlides}&type=${s.type || (num === 1 ? 'COVER' : num === totalSlides ? 'CTA' : 'CONTENT')}${bulletsParam}`;
        return {
          ...s,
          slideNumber: num,
          imageUrl: slideUrl,
          image_url: slideUrl,
          url: slideUrl,
          foto: slideUrl,
        };
      });

      const mainImageUrl = processedSlides[0]?.imageUrl || `${baseUrl}/api/v1/social/render-slide-png?title=TorxOS&slide=1&total=${totalSlides}`;

      const enrichedData = {
        ...dto.postData,
        caption: postCaption,
        legenda: postCaption,
        texto: postCaption,
        imageUrl: mainImageUrl,
        image_url: mainImageUrl,
        url: mainImageUrl,
        foto: mainImageUrl,
        slides: processedSlides,
        slide1_url: processedSlides[0]?.imageUrl || mainImageUrl,
        slide2_url: processedSlides[1]?.imageUrl || "",
        slide3_url: processedSlides[2]?.imageUrl || "",
        slide4_url: processedSlides[3]?.imageUrl || "",
        slide5_url: processedSlides[4]?.imageUrl || "",
        slide6_url: processedSlides[5]?.imageUrl || "",
      };

      const response = await fetch(dto.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "TorxOS-Social-Bot/1.0",
        },
        body: JSON.stringify({
          event: "SOCIAL_POST_SCHEDULED",
          channel: dto.channel || "INSTAGRAM",
          timestamp: new Date().toISOString(),
          caption: postCaption,
          legenda: postCaption,
          texto: postCaption,
          imageUrl: mainImageUrl,
          image_url: mainImageUrl,
          data: enrichedData,
          slides: processedSlides,
          slide1_url: processedSlides[0]?.imageUrl || mainImageUrl,
          slide2_url: processedSlides[1]?.imageUrl || "",
          slide3_url: processedSlides[2]?.imageUrl || "",
          slide4_url: processedSlides[3]?.imageUrl || "",
          slide5_url: processedSlides[4]?.imageUrl || "",
          slide6_url: processedSlides[5]?.imageUrl || "",
          hashtags: dto.postData?.hashtags || [],
        }),
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok
          ? "Post enviado com sucesso para a fila de publicação externa!"
          : `O servidor de webhook respondeu com código ${response.status}`,
      };
    } catch (err: any) {
      this.logger.error(`Erro ao disparar webhook: ${err.message}`);
      return {
        success: false,
        error: err.message,
        message: "Falha na conexão com a URL de webhook fornecida.",
      };
    }
  }

  /**
   * Gera código SVG em alta definição (1080x1080) para o slide
   */
  renderSlideSvg(slide: CarouselSlide, current: number, total: number): string {
    const isCover = slide.type === "COVER";
    const isCta = slide.type === "CTA";

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F0F0E"/>
      <stop offset="50%" stop-color="#181816"/>
      <stop offset="100%" stop-color="#1F1D19"/>
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>

  <!-- Fundo Luxury Dark -->
  <rect width="1080" height="1080" fill="url(#bgGrad)"/>

  <!-- Moldura Fina e Elegante -->
  <rect x="40" y="40" width="1000" height="1000" rx="32" fill="none" stroke="#2B2A27" stroke-width="2"/>

  <!-- Top Header: Logo TorxOS + Contador de Slide -->
  <g transform="translate(80, 100)">
    <text x="0" y="0" font-family="'Inter', -apple-system, sans-serif" font-size="26" font-weight="900" fill="#F59E0B" letter-spacing="3">TORXOS</text>
    <text x="145" y="0" font-family="'Inter', sans-serif" font-size="18" font-weight="500" fill="#787774">| SISTEMAS</text>
    <text x="920" y="0" text-anchor="end" font-family="'Inter', sans-serif" font-size="20" font-weight="700" fill="#A8A7A1">${current} / ${total}</text>
  </g>

  <!-- Badge Superior -->
  <g transform="translate(80, 180)">
    <rect width="260" height="42" rx="10" fill="#2B2A27"/>
    <text x="130" y="27" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="800" fill="#FBBF24" letter-spacing="1.5">${slide.badge.toUpperCase()}</text>
  </g>

  <!-- Título Principal -->
  <g transform="translate(80, ${isCover ? 340 : 290})">
    <text x="0" y="0" font-family="'Inter', sans-serif" font-size="${isCover ? 62 : 46}" font-weight="900" fill="#FFFFFF" width="920">
      ${this.wrapSvgText(slide.title, isCover ? 26 : 34)}
    </text>
  </g>

  <!-- Subtítulo / Descrição -->
  <g transform="translate(80, ${isCover ? 600 : 540})">
    <text x="0" y="0" font-family="'Inter', sans-serif" font-size="${isCover ? 30 : 26}" font-weight="400" fill="#A8A7A1" width="920">
      ${this.wrapSvgText(slide.subtitle || "", 44)}
    </text>
  </g>

  <!-- Bullets de Conteúdo (se houver) -->
  ${
    slide.bullets && slide.bullets.length > 0
      ? `
  <g transform="translate(80, 680)">
    ${slide.bullets
      .map(
        (bullet, idx) => `
      <g transform="translate(0, ${idx * 65})">
        <circle cx="10" cy="-6" r="6" fill="#F59E0B"/>
        <text x="32" y="0" font-family="'Inter', sans-serif" font-size="24" font-weight="500" fill="#E5E5E0">
          ${this.escapeXml(bullet)}
        </text>
      </g>
    `
      )
      .join("")}
  </g>
  `
      : ""
  }

  <!-- Footer com Linha Divisória -->
  <line x1="80" y1="940" x2="1000" y2="940" stroke="#2B2A27" stroke-width="1.5"/>
  <g transform="translate(80, 990)">
    <text x="0" y="0" font-family="'Inter', sans-serif" font-size="20" font-weight="700" fill="#FBBF24">${slide.footer}</text>
    <text x="920" y="0" text-anchor="end" font-family="'Inter', sans-serif" font-size="18" font-weight="500" fill="#787774">@torxos.sistemas</text>
  </g>
</svg>
    `.trim();
  }

  private wrapSvgText(text: string, maxCharsPerLine: number): string {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + " " + word).trim();
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    return lines
      .map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : '1.25em'}">${this.escapeXml(line)}</tspan>`)
      .join("");
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private getPillarBadge(pillar: SocialPillar): string {
    switch (pillar) {
      case SocialPillar.BANCADA_TECNICA:
        return "Bancada & Técnica";
      case SocialPillar.GESTAO_ASSISTENCIA:
        return "Gestão & Lucro";
      case SocialPillar.ATENDIMENTO_CLIENTE:
        return "Atendimento & WhatsApp";
      case SocialPillar.PRODUTIVIDADE_SISTEMA:
        return "Organização da Assistência";
      default:
        return "Dica TorxOS";
    }
  }

  private buildPostCaption(
    title: string,
    subtitle: string | undefined,
    points: string[],
    ctaText: string,
    pillar: SocialPillar
  ): string {
    const hashtags = this.getHashtagsForPillar(pillar).join(" ");

    return `🔥 ${title}

${subtitle || ""}

Se você tem assistência técnica de celulares ou computadores, salva esse post para consultar depois! 📌

👇 Principais pontos desse carrossel:
${points.map((p) => `• ${p}`).join("\n")}

💡 ${ctaText}

Gostou da dica?
💬 Deixa nos comentários qual é a sua maior dificuldade na bancada hoje!
🚀 Compartilha com aquele amigo técnico que precisa organizar a assistência técnica.

.
.
${hashtags}`.trim();
  }

  private getHashtagsForPillar(pillar: SocialPillar): string[] {
    const base = [
      "#assistenciatecnica",
      "#consertodecelular",
      "#tecnicoemcelular",
      "#gestaodeassistencia",
      "#torxos",
      "#lojadegelular",
    ];

    switch (pillar) {
      case SocialPillar.BANCADA_TECNICA:
        return [...base, "#microsoldagem", "#reparodeplaca", "#trocadetela", "#ferramentasbancada"];
      case SocialPillar.GESTAO_ASSISTENCIA:
        return [...base, "#lucratividade", "#precificacao", "#controledeestoque", "#empreendedorismo"];
      case SocialPillar.ATENDIMENTO_CLIENTE:
        return [...base, "#fidelizacaodeclientes", "#atendimentonowhatsapp", "#ordemdeservico"];
      default:
        return [...base, "#produtividade", "#organizacaodeassistencia", "#softwaredegestao"];
    }
  }
}
