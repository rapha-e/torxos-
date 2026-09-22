import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export interface FounderLead {
  id: string;
  name: string;
  companyName: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  businessType: string;
  monthlyOrders: string;
  planInterest: string;
  message?: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "DEMO_SCHEDULED" | "APPROVED" | "CONVERTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

const MAX_FOUNDER_SLOTS = 10;
const LEADS_FILE_PATH = path.join(process.cwd(), "founder-leads.json");

function readStoredLeads(): FounderLead[] {
  try {
    if (fs.existsSync(LEADS_FILE_PATH)) {
      const data = fs.readFileSync(LEADS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Aviso ao ler leads armazenados:", err);
  }
  return [];
}

function saveLeads(leads: FounderLead[]): void {
  try {
    fs.writeFileSync(LEADS_FILE_PATH, JSON.stringify(leads, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao persistir lead de fundador:", err);
  }
}

/**
 * Notificação assíncrona segura via WhatsApp Evolution API (se configurado)
 */
async function sendWhatsAppNotifications(lead: FounderLead) {
  try {
    const apiUrl = process.env.EVOLUTION_API_URL || "http://evorix_whatsapp:8080";
    const apiKey = process.env.EVOLUTION_API_KEY || "ae00620eeb4dedf1d95d82c60e91d2db6b605d10a84177ae";
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "torxos";

    const cleanCandidatePhone = lead.whatsapp.replace(/\D/g, "");
    const candidatePhone = cleanCandidatePhone.length <= 11 ? `55${cleanCandidatePhone}` : cleanCandidatePhone;

    // 1. Mensagem de Boas-vindas e Confirmação para o Candidato
    const candidateMsg = `👋 Olá *${lead.name}*!\n\nRecebemos com sucesso sua candidatura ao *Programa Fundador TorxOS* para a assistência *${lead.companyName}*.\n\n📌 *Plano selecionado:* ${lead.planInterest}\n\nNossa equipe entrará em contato em breve para liberar sua condição especial vitalícia de Membro Fundador.\n\nSeja muito bem-vindo ao futuro da gestão de assistências técnicas! 🚀`;

    await fetch(`${apiUrl.replace(/\/$/, "")}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: candidatePhone,
        text: candidateMsg,
      }),
    }).catch(() => null);

    // 2. Notificação interna para o Administrador (Raphael) se número estiver configurado
    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || "5561992144732";
    if (adminPhone) {
      const adminMsg = `⭐ *NOVO MEMBRO FUNDADOR CANDIDATO!*\n\n• *Nome:* ${lead.name}\n• *Empresa:* ${lead.companyName}\n• *WhatsApp:* ${lead.whatsapp}\n• *E-mail:* ${lead.email}\n• *Cidade/UF:* ${lead.city}/${lead.state}\n• *Tipo:* ${lead.businessType}\n• *Volume OS:* ${lead.monthlyOrders}\n• *Plano:* ${lead.planInterest}\n• *Como gerencia hoje:* ${lead.message || "Não informado"}`;

      await fetch(`${apiUrl.replace(/\/$/, "")}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: adminPhone.replace(/\D/g, ""),
          text: adminMsg,
        }),
      }).catch(() => null);
    }
  } catch (err) {
    console.warn("Disparo automático WhatsApp não efetuado (Evolution API offline ou não pareada):", err);
  }
}

// GET: Consulta status das vagas
export async function GET() {
  try {
    const leads = readStoredLeads();
    const approvedCount = leads.filter(
      (l) => l.status === "APPROVED" || l.status === "CONVERTED"
    ).length;

    const availableSlots = Math.max(0, MAX_FOUNDER_SLOTS - approvedCount);

    return NextResponse.json({
      success: true,
      maxSlots: MAX_FOUNDER_SLOTS,
      availableSlots,
      isFull: availableSlots <= 0,
      totalRegistrations: leads.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao consultar vagas do Programa Fundador" },
      { status: 500 }
    );
  }
}

// POST: Recebe e valida nova candidatura ao Programa Fundador
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      companyName,
      whatsapp,
      email,
      cityState,
      businessType,
      monthlyOrders,
      planInterest,
      message,
    } = body;

    // Validações obrigatórias
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Nome é obrigatório." },
        { status: 400 }
      );
    }
    if (!companyName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Nome da assistência é obrigatório." },
        { status: 400 }
      );
    }
    if (!whatsapp?.trim()) {
      return NextResponse.json(
        { success: false, error: "WhatsApp comercial é obrigatório." },
        { status: 400 }
      );
    }
    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "E-mail comercial válido é obrigatório." },
        { status: 400 }
      );
    }
    if (!cityState?.trim()) {
      return NextResponse.json(
        { success: false, error: "Cidade/Estado é obrigatório." },
        { status: 400 }
      );
    }
    if (!businessType?.trim()) {
      return NextResponse.json(
        { success: false, error: "Selecione o tipo de assistência." },
        { status: 400 }
      );
    }
    if (!monthlyOrders?.trim()) {
      return NextResponse.json(
        { success: false, error: "Selecione a quantidade de OS por mês." },
        { status: 400 }
      );
    }
    if (!planInterest?.trim()) {
      return NextResponse.json(
        { success: false, error: "Selecione o plano de interesse." },
        { status: 400 }
      );
    }

    // Dividir cidade e estado se aplicável
    let city = cityState.trim();
    let state = "";
    if (cityState.includes("/")) {
      const parts = cityState.split("/");
      city = parts[0].trim();
      state = (parts[1] || "").trim().toUpperCase();
    } else if (cityState.includes("-")) {
      const parts = cityState.split("-");
      city = parts[0].trim();
      state = (parts[1] || "").trim().toUpperCase();
    }

    const leads = readStoredLeads();

    const approvedCount = leads.filter(
      (l) => l.status === "APPROVED" || l.status === "CONVERTED"
    ).length;
    const isFull = approvedCount >= MAX_FOUNDER_SLOTS;

    const newLead: FounderLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      companyName: companyName.trim(),
      whatsapp: whatsapp.replace(/[^\d+]/g, "").trim(),
      email: email.trim().toLowerCase(),
      city,
      state,
      businessType: businessType.trim(),
      monthlyOrders: monthlyOrders.trim(),
      planInterest: planInterest.trim(),
      message: message?.trim() || "",
      status: "NEW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.push(newLead);
    saveLeads(leads);

    // Dispara WhatsApp em segundo plano
    sendWhatsAppNotifications(newLead).catch((err) =>
      console.warn("Erro ao disparar WhatsApp de fundador:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Interesse registrado com sucesso.",
      leadId: newLead.id,
      isFull,
    });
  } catch (error: any) {
    console.error("Erro ao processar lead do Programa Fundador:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao processar solicitação. Tente novamente." },
      { status: 500 }
    );
  }
}
