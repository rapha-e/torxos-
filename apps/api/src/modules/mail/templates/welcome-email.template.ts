export interface WelcomeEmailData {
  ownerName: string;
  companyName: string;
  email: string;
  password: string;
  loginUrl?: string;
  supportPhone?: string;
}

export function buildWelcomeEmailHtml(data: WelcomeEmailData): string {
  const loginUrl = data.loginUrl || "https://torxos.tech/login";
  const supportPhone = data.supportPhone || "(61) 99229-5814";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao TorxOS</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F4F4F0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1C1C1A;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F4F4F0;
      padding: 40px 0;
    }
    .main-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(28, 25, 23, 0.08);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #181816;
      padding: 36px 40px;
      text-align: center;
    }
    .brand {
      color: #FFFFFF;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-accent {
      color: #E2A336;
    }
    .badge-tag {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      background-color: rgba(226, 163, 54, 0.15);
      border: 1px solid rgba(226, 163, 54, 0.3);
      border-radius: 999px;
      color: #E2A336;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #1C1C1A;
      margin: 0 0 16px 0;
      letter-spacing: -0.3px;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #575752;
      margin: 0 0 20px 0;
    }
    .credentials-card {
      background-color: #FAF9F6;
      border: 1px solid #EBEBE8;
      border-radius: 16px;
      padding: 24px;
      margin: 28px 0;
    }
    .credentials-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8C8B85;
      margin: 0 0 16px 0;
    }
    .credential-row {
      margin-bottom: 12px;
    }
    .credential-label {
      font-size: 11px;
      font-weight: 600;
      color: #71716C;
      text-transform: uppercase;
      display: block;
      margin-bottom: 4px;
    }
    .credential-value {
      font-size: 14px;
      font-weight: 700;
      color: #181816;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      background-color: #FFFFFF;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(28, 25, 23, 0.08);
      display: inline-block;
      min-width: 220px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .btn-primary {
      display: inline-block;
      background-color: #181816;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
      border: 1px solid #E2A336;
    }
    .tips-card {
      background-color: #F8F9FA;
      border-radius: 14px;
      padding: 20px;
      margin-top: 24px;
    }
    .tips-title {
      font-size: 13px;
      font-weight: 700;
      color: #1C1C1A;
      margin: 0 0 10px 0;
    }
    .tip-item {
      font-size: 12px;
      color: #575752;
      line-height: 1.5;
      margin-bottom: 8px;
    }
    .footer {
      background-color: #FAF9F6;
      border-top: 1px solid #EBEBE8;
      padding: 24px 40px;
      text-align: center;
      font-size: 11px;
      color: #8C8B85;
      line-height: 1.5;
    }
    .support-link {
      color: #1C1C1A;
      font-weight: 600;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <!-- Header com Identidade Visual -->
      <div class="header">
        <h1 class="brand">Torx<span class="brand-accent">OS</span></h1>
        <div class="badge-tag">Plataforma Inteligente de Bancada</div>
      </div>

      <!-- Conteúdo Principal -->
      <div class="content">
        <h2 class="greeting">Olá, ${data.ownerName}! 👋</h2>
        
        <p class="paragraph">
          Seja muito bem-vindo ao <strong>TorxOS</strong>! Ficamos muito felizes em ter a <strong>${data.companyName}</strong> conosco.
        </p>

        <p class="paragraph">
          Seu teste gratuito de <strong>7 dias VIP</strong> já está liberado com todas as funcionalidades ativas (Gestão de OS, Controle de Estoque com Margem Automática, Frente de Caixa PDV e AI Mentor).
        </p>

        <!-- Card Seguro de Credenciais -->
        <div class="credentials-card">
          <div class="credentials-title">🔐 Suas Credenciais de Acesso</div>

          <div class="credential-row">
            <span class="credential-label">Endereço da Plataforma</span>
            <span class="credential-value">${loginUrl}</span>
          </div>

          <div class="credential-row">
            <span class="credential-label">Seu Login (E-mail)</span>
            <span class="credential-value">${data.email}</span>
          </div>

          <div class="credential-row" style="margin-bottom: 0;">
            <span class="credential-label">Sua Senha</span>
            <span class="credential-value">${data.password}</span>
          </div>
        </div>

        <!-- Botão CTA Principal -->
        <div class="btn-container">
          <a href="${loginUrl}" target="_blank" class="btn-primary">
            Acessar Minha Assistência Técnica →
          </a>
        </div>

        <!-- Dica de Primeiros Passos -->
        <div class="tips-card">
          <div class="tips-title">💡 Dica de ouro para os seus primeiros minutos:</div>
          <div class="tip-item">
            1. Abra sua primeira Ordem de Serviço em <strong>Nova OS</strong> para testar a impressão térmica e o checklist fotográfico pelo celular.
          </div>
          <div class="tip-item">
            2. Cadastre 2 ou 3 produtos no <strong>Estoque</strong> para ver o cálculo inteligente de margem de lucro em funcionamento.
          </div>
          <div class="tip-item" style="margin-bottom: 0;">
            3. Acompanhe a bancada em tempo real no quadro <strong>Kanban de OS</strong>.
          </div>
        </div>
      </div>

      <!-- Rodapé com Suporte -->
      <div class="footer">
        <p style="margin: 0 0 6px 0;">
          Dúvidas ou precisa de ajuda na configuração? Fale com a gente direto no WhatsApp: 
          <a href="https://wa.me/5561992295814" target="_blank" class="support-link">${supportPhone}</a>
        </p>
        <p style="margin: 0;">
          TorxOS Multi-Tenant SaaS • A tecnologia feita por quem entende de bancada.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
