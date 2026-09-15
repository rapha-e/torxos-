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
