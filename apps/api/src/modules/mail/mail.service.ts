import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { buildWelcomeEmailHtml, WelcomeEmailData } from "./templates/welcome-email.template";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });
        this.logger.log(`[MAIL] Serviço de e-mail SMTP conectado via ${host}:${port}`);
      } catch (e: any) {
        this.logger.warn(`[MAIL] Falha ao inicializar SMTP: ${e.message}`);
        this.transporter = null;
      }
    } else {
      this.logger.log("[MAIL] Variáveis SMTP não configuradas. Modo de visualização/log ativo.");
    }
  }

  /**
   * Envia e-mail de boas-vindas com credenciais de acesso para novo lojista
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const fromAddress = process.env.SMTP_FROM || '"TorxOS" <suporte@torxos.tech>';
    const html = buildWelcomeEmailHtml(data);
    const subject = `🎉 Bem-vindo ao TorxOS, ${data.ownerName}! Seus dados de acesso`;

    this.logger.log(`[MAIL] Preparando envio de boas-vindas para: ${data.email} (${data.companyName})`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: data.email,
          subject,
          html,
        });
        this.logger.log(`[MAIL] E-mail de boas-vindas enviado com sucesso para ${data.email}!`);
        return true;
      } catch (err: any) {
        this.logger.error(`[MAIL] Erro ao enviar e-mail via SMTP para ${data.email}: ${err.message}`);
        return false;
      }
    } else {
      this.logger.log(`[MAIL MOCK] E-mail de boas-vindas gerado para ${data.email}. Senha: [PROTEGIDA]`);
      return true;
    }
  }
}
