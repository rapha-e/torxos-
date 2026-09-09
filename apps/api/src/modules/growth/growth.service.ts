import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GenerateAdsDto,
  AdsFocusTopic,
  AdsChannel,
  CopyFramework,
  GeneratePayloadDto,
} from "./dto/generate-ads.dto";

@Injectable()
export class GrowthService {
  private readonly logger = new Logger(GrowthService.name);
  private readonly geminiApiKey: string;

  constructor(private configService: ConfigService) {
    this.geminiApiKey =
      this.configService.get<string>("GEMINI_API_KEY") ||
      process.env.GEMINI_API_KEY ||
      "";
  }

  // =========================================================================
  // 1. BANCO DE PERSONAS E DORES DE BANCADA
  // =========================================================================

  getGrowthPresets() {
    return {
      niche: "Assistências Técnicas de Celulares, Tablets, Notebooks e Games",
      icp: "Dono de assistência técnica que conserta na bancada, atende no balcão e gerencia funcionários, faturando de R$ 15k a R$ 80k/mês.",
      targetAudienceAge: "22 a 50 anos, homens e mulheres, técnicos e empreendedores",
      mainPainPoints: [
        {
          id: "ESTOQUE",
          title: "Peças que Somem e Ruptura de Almoxarifado",
          hook: "Quantas telas e baterias já sumiram na sua oficina sem ninguém saber onde foram parar?",
          coreSolution: "Baixa automática na OS, cálculo de custo real da peça e alerta de reposição antes de esgotar.",
        },
        {
          id: "OS_WHATSAPP",
          title: "Clientes Cobrando Status o Dia Inteiro no WhatsApp",
          hook: "Você passa mais tempo respondendo 'já ficou pronto?' no WhatsApp do que consertando aparelho na bancada?",
          coreSolution: "Impressão térmica com QR Code. O cliente acompanha as fotos do conserto e aprova o orçamento pelo celular.",
        },
        {
          id: "FINANCEIRO_DRE",
          title: "Não Saber se Teve Lucro ou Prejuízo no Fim do Mês",
          hook: "Bancada cheia de aparelhos, mas no fim do mês a conta jurídica continua no vermelho?",
          coreSolution: "DRE Gerencial automático e conciliação Pix que mostram seu lucro líquido no centavo.",
        },
        {
          id: "AI_MENTOR",
          title: "Orçamentos Mal Calculados e Prejuízo em Garantias",
          hook: "Cobrar barato por medo do cliente recusar é o jeito mais rápido de quebrar sua assistência.",
          coreSolution: "Inteligência artificial nativa que calcula a margem ideal e redige mensagens persuasivas de aprovação.",
        },
      ],
      offer: "7 Dias de Teste Grátis sem cadastrar cartão de crédito. Comece em 60 segundos em app.torxos.com.br/lp",
    };
  }

  // =========================================================================
  // 2. GERAÇÃO INTELIGENTE DE ANÚNCIOS (IA + TEMPLATES ESTRUTURADOS)
  // =========================================================================

  async generateAds(dto: GenerateAdsDto) {
    const focus = dto.focus || AdsFocusTopic.GERAL;
    const count = dto.count || 3;
    const channel = dto.channel || AdsChannel.ALL;

    this.logger.log(`[Growth] Gerando anúncios - Foco: ${focus} | Canal: ${channel} | Qtd: ${count}`);

    // Se houver chave do Gemini configurada, tenta chamar a IA
    if (this.geminiApiKey) {
      try {
        const aiResult = await this.callGeminiForAds(dto);
        if (aiResult) {
          return aiResult;
        }
      } catch (err: any) {
        this.logger.warn(`[Growth] Falha ao chamar Gemini API: ${err.message}. Usando motor de copy algorítmico de alta conversão.`);
      }
    }

    // Motor de copy com templates validados para assistências técnicas
    return this.generateAlgorithmicAds(dto);
  }

  // =========================================================================
  // 3. MOTOR DE COPY ALGORÍTMICO (GARANTIA 100% OPERACIONAL)
  // =========================================================================

  private generateAlgorithmicAds(dto: GenerateAdsDto) {
    const focus = dto.focus || AdsFocusTopic.GERAL;
    const count = dto.count || 3;

    const feedAds = [
      {
        id: "meta-feed-1",
        channel: "META_ADS",
        placement: "FEED_INSTAGRAM_FACEBOOK",
        framework: "PAS (Problema - Agitação - Solução)",
        angle: "Peças Sumindo & Descontrole de Estoque",
        hook: "🚨 Sua bancada está cheia de aparelhos, mas no fim do mês o dinheiro simplesmente SOME?",
        primaryText:
          "Se você é dono de assistência técnica, já passou por isso:\n\n" +
          "❌ Chega cliente com tela de iPhone 13 para trocar urgente, você abre a gaveta e a peça sumiu.\n" +
          "❌ O cliente liga de 10 em 10 minutos cobrando se o aparelho já ficou pronto.\n" +
          "❌ No fim do mês, você pagou fornecedor, aluguel, equipe... e o lucro sumiu.\n\n" +
          "O TorxOS é o Sistema Operacional feito exclusivamente para quem conserta na bancada e quer lucrar de verdade.\n\n" +
          "✅ Entrada de OS com foto e laudo em 1 minuto\n" +
          "✅ QR Code impresso no aparelho para o cliente consultar o status pelo celular\n" +
          "✅ Alerta inteligente de peças antes de faltar estoque\n" +
          "✅ DRE e Lucro Líquido no centavo sem precisar de planilha\n\n" +
          "👉 Comece agora com 7 DIAS GRÁTIS sem precisar cadastrar cartão de crédito!",
        headline: "Sistema para Assistência Técnica de Celulares • Teste Grátis",
        description: "Mais de 1.250 assistências já aumentaram seu lucro com o TorxOS.",
        callToAction: "Cadastre-se Grátis",
        destinationUrl: "https://app.torxos.com.br/lp?utm_source=meta&utm_medium=feed&utm_campaign=estoque",
      },
      {
        id: "meta-feed-2",
        channel: "META_ADS",
        placement: "FEED_INSTAGRAM_FACEBOOK",
        framework: "AIDA (Atenção - Interesse - Desejo - Ação)",
        angle: "WhatsApp Automático & Ordem de Serviço Digital",
        hook: "📱 Pare de perder tempo respondendo 'já ficou pronto?' no WhatsApp!",
        primaryText:
          "Imagine o seu cliente deixando o celular na sua bancada e recebendo na mesma hora uma mensagem profissional no WhatsApp com o link do conserto.\n\n" +
          "Ele acompanha as fotos da desmontagem, vê a peça que foi trocada e APROVA o orçamento com um toque pelo celular.\n\n" +
          "Sem ligações chatas. Sem discussão sobre garantia. Sem desculpas de 'não autorizei essa troca'.\n\n" +
          "O TorxOS organiza sua recepção, sua bancada e o seu caixa.\n\n" +
          "🚀 Teste 100% grátis por 7 dias. Não pedimos cartão de crédito!",
        headline: "Ordens de Serviço no WhatsApp com QR Code • Teste 7 Dias",
        description: "Transforme sua oficina numa empresa profissional e organizada.",
        callToAction: "Começar Teste Grátis",
        destinationUrl: "https://app.torxos.com.br/lp?utm_source=meta&utm_medium=feed&utm_campaign=whatsapp_os",
      },
      {
        id: "meta-feed-3",
        channel: "META_ADS",
        placement: "FEED_INSTAGRAM_FACEBOOK",
        framework: "DIRECT_RESPONSE",
        angle: "Lucro Real & AI Mentor de Gestão",
        hook: "💡 Você sabe exatamente quanto lucrou em cada troca de conector ou reparo de placa?",
        primaryText:
          "Muitos técnicos cobram no 'achômetro' por medo de perder o cliente para o concorrente da esquina.\n\n" +
          "O resultado? Você trabalha 12 horas por dia na bancada, inalando fumaça de solda, e o lucro não aparece.\n\n" +
          "Com o TorxOS e o nosso exclusivo AI Mentor de Bancada, o sistema calcula sua margem real considerando o custo da peça, imposto e comissão do técnico.\n\n" +
          "Chega de tomar prejuízo. Assuma o controle da sua oficina hoje mesmo.\n\n" +
          "🎁 Libere seu acesso de 7 dias grátis em menos de 60 segundos.",
        headline: "Pare de Cobrar Barato • Sistema de Gestão para Assistência",
        description: "Controle financeiro, DRE e Mentor de IA na sua bancada.",
        callToAction: "Cadastre-se",
        destinationUrl: "https://app.torxos.com.br/lp?utm_source=meta&utm_medium=feed&utm_campaign=ai_mentor",
      },
    ].slice(0, count);

    // Roteiros para Stories / Reels / TikTok (Vídeo 9:16)
    const videoAds = [
      {
        id: "reels-1",
        channel: "META_ADS",
        placement: "STORIES_REELS_TIKTOK_9_16",
        duration: "30 a 45 segundos",
        title: "Roteiro: O Caderno vs. TorxOS",
        script: [
          {
            scene: "Ato 1 (0-3s) • O Gancho",
            visual: "Técnico filmando uma pilha de blocos de papel de OS rasurados e uma gaveta cheia de telas soltas.",
            audio: "Se a sua assistência técnica ainda usa bloquinho de papel ou caderno para anotar OS... você está perdendo pelo menos 3 mil reais por mês!",
          },
          {
            scene: "Ato 2 (4-15s) • A Dor",
            visual: "Técnico mostrando o celular apitando com 5 clientes perguntando se o celular ficou pronto.",
            audio: "O cliente liga cobrando, você não acha a peça na gaveta e no fim do mês não sabe quanto sobrou no caixa.",
          },
          {
            scene: "Ato 3 (16-30s) • A Solução",
            visual: "Gravação da tela do celular/computador mostrando o TorxOS: Kanban de bancada com fotos e botão de enviar OS no WhatsApp.",
            audio: "Com o TorxOS, você imprime a etiqueta com QR Code na hora, o cliente acompanha pelo WhatsApp e o sistema avisa quando a peça vai acabar no estoque.",
          },
          {
            scene: "Ato 4 (31-40s) • O CTA",
            visual: "Texto na tela: '7 Dias Grátis - Sem Cartão'. Apontando para o botão de 'Saiba Mais'.",
            audio: "Clica no link aqui embaixo e testa grátis por 7 dias. Não precisa nem colocar cartão de crédito!",
          },
        ],
        caption: "Sua bancada merece um sistema profissional. Teste o TorxOS grátis por 7 dias no link da bio! 🛠️📱 #assistenciatecnica #consertodecelular #bancada #torxos",
      },
    ];

    // Campanhas de Google Search Ads
    const googleSearchAds = {
      campaignName: "Google Search - Fundo de Funil - Sistema Assistência Técnica",
      headlines: [
        "Sistema para Assistência",
        "Programa Ordem de Serviço",
        "TorxOS • Teste 7 Dias Grátis",
        "Software Oficina Celular",
        "Gestão Completa de Bancada",
      ],
      descriptions: [
        "Elimine o caderno e controle ordens de serviço, estoque de peças e caixa. Teste 7 dias grátis!",
        "Envio de OS por WhatsApp, QR Code no aparelho e alerta de estoque com Inteligência Artificial.",
        "Mais de 1.200 assistências usam o TorxOS. Sem cartão de crédito inicial. Comece já!",
      ],
      keywords: [
        { term: "sistema para assistencia tecnica", matchType: "PHRASE" },
        { term: "software para assistencia tecnica de celulares", matchType: "EXACT" },
        { term: "programa para emitir ordem de servico celular", matchType: "PHRASE" },
        { term: "sistema ordem de servico impressao termica", matchType: "PHRASE" },
        { term: "controle de estoque para assistencia tecnica", matchType: "PHRASE" },
        { term: "software gestao assistencia tecnica gratis", matchType: "PHRASE" },
      ],
      finalUrl: "https://app.torxos.com.br/lp?utm_source=google&utm_medium=cpc&utm_campaign=search_institucional",
    };

    return {
      success: true,
      timestamp: new Date().toISOString(),
      focus,
      feedAds,
      videoAds,
      googleSearchAds,
    };
  }

  // =========================================================================
  // 4. INTEGRAÇÃO COM GEMINI AI (SE DISPONÍVEL)
  // =========================================================================

  private async callGeminiForAds(dto: GenerateAdsDto) {
    const prompt = `
Você é o Chief Marketing Officer (CMO) e Copywriter de Resposta Direta do SaaS TorxOS (https://app.torxos.com.br/lp).
O TorxOS é a melhor plataforma de gestão para assistências técnicas de celular, tablet e notebooks no Brasil.
Planos: Starter R$97, Pro R$197, Enterprise R$347. Oferta: 7 Dias de Teste Grátis sem cartão de crédito.

Crie exatamente ${dto.count || 3} variações de anúncios de alta conversão para tráfego pago (Instagram Feed, Stories e Google Search).
Foco temático: ${dto.focus || "GERAL"}
Framework desejado: ${dto.framework || "PAS"}
Instruções adicionais: ${dto.customInstructions || "Nenhuma"}

Retorne a resposta EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
{
  "feedAds": [
    {
      "id": "meta-feed-1",
      "channel": "META_ADS",
      "placement": "FEED_INSTAGRAM_FACEBOOK",
      "framework": "PAS",
      "angle": "string",
      "hook": "string",
      "primaryText": "string",
      "headline": "string (máximo 45 caracteres)",
      "description": "string",
      "callToAction": "Cadastre-se",
      "destinationUrl": "https://app.torxos.com.br/lp"
    }
  ],
  "videoAds": [
    {
      "id": "reels-1",
      "title": "string",
      "duration": "30s",
      "script": [
        { "scene": "string", "visual": "string", "audio": "string" }
      ],
      "caption": "string"
    }
  ],
  "googleSearchAds": {
    "headlines": ["string (max 30 chars)", "string", "string", "string", "string"],
    "descriptions": ["string (max 90 chars)", "string", "string"],
    "keywords": [
      { "term": "string", "matchType": "PHRASE" }
    ],
    "finalUrl": "https://app.torxos.com.br/lp"
  }
}
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) return null;

    const parsed = JSON.parse(textContent);
    return {
      success: true,
      timestamp: new Date().toISOString(),
      provider: "GEMINI_AI",
      focus: dto.focus,
      ...parsed,
    };
  }

  // =========================================================================
  // 5. EXPORTADOR DE PAYLOAD PARA META MARKETING API
  // =========================================================================

  generateMetaMarketingPayload(dto: GeneratePayloadDto, selectedAd: any) {
    const budgetInCents = Math.round((dto.dailyBudget || 30) * 100);

    return {
      campaign: {
        name: `[TorxOS] Conversão - ${selectedAd.angle || "Geral"} - [CPL]`,
        objective: "OUTCOME_LEADS",
        status: "PAUSED", // Começa pausado para aprovação humana
        special_ad_categories: [],
      },
      adSet: {
        name: `[Aberto 22-50] - Assistência Técnica - R$ ${(dto.dailyBudget || 30).toFixed(2)}/dia`,
        daily_budget: budgetInCents,
        billing_event: "IMPRESSIONS",
        optimization_goal: "LEAD_GENERATION",
        promoted_object: {
          pixel_id: dto.pixelId || "SEU_PIXEL_ID_AQUI",
          custom_event_type: "LEAD",
        },
        targeting: {
          geo_locations: { countries: ["BR"] },
          age_min: 22,
          age_max: 50,
          interests: [
            { id: "6003140708570", name: "Mobile phone repair" },
            { id: "6003294326581", name: "Electronics technician" },
            { id: "6003126839384", name: "Small business" },
          ],
        },
        status: "PAUSED",
      },
      creative: {
        name: `Criativo - ${selectedAd.headline || "TorxOS 7 Dias Grátis"}`,
        object_story_spec: {
          page_id: "SUA_PAGINA_FACEBOOK_ID",
          link_data: {
            link: dto.destinationUrl || "https://app.torxos.com.br/lp",
            message: selectedAd.primaryText,
            name: selectedAd.headline,
            description: selectedAd.description,
            call_to_action: {
              type: "SIGN_UP",
              value: {
                link: dto.destinationUrl || "https://app.torxos.com.br/lp",
              },
            },
          },
        },
      },
      metaCliInstructions: `
Para publicar via cURL na Meta Marketing API:
curl -X POST "https://graph.facebook.com/v19.0/${dto.adAccountId}/campaigns" \\
  -F "name=[TorxOS] Conversão - ${selectedAd.angle || "Geral"}" \\
  -F "objective=OUTCOME_LEADS" \\
  -F "status=PAUSED" \\
  -F "access_token=SEU_ACCESS_TOKEN_META"
      `,
    };
  }
}
