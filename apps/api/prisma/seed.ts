import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  ATTENDANT: "ATTENDANT",
  TECHNICIAN: "TECHNICIAN",
  FINANCIAL: "FINANCIAL",
} as const;

const OsStatus = {
  TRIAGE: "TRIAGE",
  ANALYSIS: "ANALYSIS",
  AWAITING_APPROVAL: "AWAITING_APPROVAL",
  APPROVED: "APPROVED",
  IN_MAINTENANCE: "IN_MAINTENANCE",
  AWAITING_PARTS: "AWAITING_PARTS",
  QUALITY_CHECK: "QUALITY_CHECK",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  DELIVERED: "DELIVERED",
  CANCELED: "CANCELED",
} as const;

const TransactionType = {
  RECEIVABLE: "RECEIVABLE",
  PAYABLE: "PAYABLE",
} as const;

const TransactionStatus = {
  PENDING: "PENDING",
  SETTLED: "SETTLED",
  PARTIALLY_SETTLED: "PARTIALLY_SETTLED",
  CANCELLED: "CANCELLED",
} as const;

async function main() {
  console.log("🌱 Iniciando Seeding do TorxOS com dados de produção...");

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { document: "12.345.678/0001-99" },
    update: {},
    create: {
      tradeName: "TorxOS Tech Center - Matriz",
      legalName: "TorxOS Solucoes em Tecnologia e Manutencao LTDA",
      document: "12.345.678/0001-99",
      phone: "(11) 98888-7766",
      email: "contato@torxos.com.br",
      plan: "ENTERPRISE",
      settings: JSON.stringify({
        currency: "BRL",
        enable_whatsapp_auto: true,
        warranty_days_default: 90,
      }),
    },
  });

  console.log(`✅ Tenant criado/verificado: ${tenant.tradeName} (${tenant.id})`);

  // 2. Usuários
  const passwordHash = await bcrypt.hash("senha123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "gestor@torxos.com.br" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Raphael Gestor",
      email: "gestor@torxos.com.br",
      passwordHash,
      role: UserRole.ADMIN,
      commissionServicesPercent: 0,
      commissionProductsPercent: 0,
    },
  });

  const superAdminPasswordHash = await bcrypt.hash("Dio@sup.22031985", 10);
  const superAdminUser = await prisma.user.upsert({
    where: { email: "rafa.busy@gmail.com" },
    update: {
      passwordHash: superAdminPasswordHash,
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
    },
    create: {
      tenantId: null, // Super Admin Global desvinculado
      name: "Raphael Super Admin",
      email: "rafa.busy@gmail.com",
      passwordHash: superAdminPasswordHash,
      role: UserRole.SUPER_ADMIN,
      commissionServicesPercent: 0,
      commissionProductsPercent: 0,
    },
  });

  const techUser = await prisma.user.upsert({
    where: { email: "lucas.tecnico@torxos.com.br" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Lucas Técnico Especialista",
      email: "lucas.tecnico@torxos.com.br",
      passwordHash,
      role: UserRole.TECHNICIAN,
      commissionServicesPercent: 15.0,
      commissionProductsPercent: 5.0,
    },
  });

  console.log(`✅ Usuários criados: ${adminUser.name}, ${techUser.name}`);

  // 3. Plano de Contas
  const chartRevenue = await prisma.chartOfAccount.upsert({
    where: { uq_tenant_account_code: { tenantId: tenant.id, code: "3.1.01" } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: "3.1.01",
      name: "Receita de Manutenção & Reparos em Bancada",
      accountType: "REVENUE",
    },
  });

  await prisma.chartOfAccount.upsert({
    where: { uq_tenant_account_code: { tenantId: tenant.id, code: "4.1.01" } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: "4.1.01",
      name: "Custo de Peças e Componentes Aplicados",
      accountType: "COST",
    },
  });

  await prisma.chartOfAccount.upsert({
    where: { uq_tenant_account_code: { tenantId: tenant.id, code: "4.1.02" } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: "4.1.02",
      name: "Comissões da Equipe Técnica",
      accountType: "COST",
    },
  });

  // 4. Contas Bancárias / Caixas
  const cashRegister = await prisma.bankAccount.create({
    data: {
      tenantId: tenant.id,
      name: "Caixa Balcão 1 (Gaveta)",
      accountType: "CASH_REGISTER",
      initialBalance: 500.0,
      currentBalance: 1250.0,
    },
  });

  const bankItau = await prisma.bankAccount.create({
    data: {
      tenantId: tenant.id,
      name: "Itaú Empresas PJ",
      accountType: "CHECKING_ACCOUNT",
      initialBalance: 15000.0,
      currentBalance: 24350.0,
    },
  });

  console.log(`✅ Contas criadas: ${cashRegister.name}, ${bankItau.name}`);

  // 5. Clientes
  const client1 = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Mariana Alcantara Silva",
      document: "349.201.882-10",
      phone: "(11) 97123-4455",
      email: "mariana.alcantara@gmail.com",
      address: JSON.stringify({
        street: "Av. Paulista",
        number: "1000",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
      }),
    },
  });

  const client2 = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Carlos Eduardo Ferreira",
      document: "192.482.019-33",
      phone: "(11) 98234-9988",
      email: "carlos.ferreira@empresa.com.br",
    },
  });

  // 6. Produtos & Peças (com parâmetros preditivos)
  const telaIphone13 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: "TEL-IPH13-OLED",
      barcode: "7891234567890",
      name: "Tela OLED Original iPhone 13 Pro Max",
      category: "Telas e Displays",
      brand: "Apple",
      costPrice: 380.0,
      salePrice: 890.0,
      currentStock: 2.0, // ESTOQUE BAIXO! Vai disparar CRITICAL
      supplierLeadTimeDays: 4,
      safetyStockCalculated: 3.0,
      reorderPointCalculated: 7.0,
      dailyAvgConsumption: 1.2,
      daysUntilStockout: 1,
      stockoutRiskStatus: "CRITICAL",
      shelfLocation: "Gaveta B-04",
    },
  });

  const bateriaS22 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: "BAT-SAMS22-ORIG",
      barcode: "7891234567891",
      name: "Bateria Original Samsung Galaxy S22",
      category: "Baterias",
      brand: "Samsung",
      costPrice: 95.0,
      salePrice: 240.0,
      currentStock: 5.0, // WARNING
      supplierLeadTimeDays: 3,
      safetyStockCalculated: 2.0,
      reorderPointCalculated: 5.0,
      dailyAvgConsumption: 0.8,
      daysUntilStockout: 6,
      stockoutRiskStatus: "WARNING",
      shelfLocation: "Gaveta A-12",
    },
  });

  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: "CON-USBC-UNIV",
      barcode: "7891234567892",
      name: "Conector de Carga USB-C Universal SMD",
      category: "Conectores",
      brand: "Generic",
      costPrice: 8.0,
      salePrice: 90.0,
      currentStock: 45.0, // HEALTHY
      supplierLeadTimeDays: 2,
      safetyStockCalculated: 4.0,
      reorderPointCalculated: 10.0,
      dailyAvgConsumption: 1.5,
      daysUntilStockout: 30,
      stockoutRiskStatus: "HEALTHY",
      shelfLocation: "Gaveta C-01",
    },
  });

  console.log("✅ Peças cadastradas com semáforos preditivos configurados.");

  // 7. Ordens de Serviço
  const os1 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      clientId: client1.id,
      technicianId: techUser.id,
      osNumber: 1001,
      status: OsStatus.AWAITING_APPROVAL,
      priority: "URGENT",
      deviceType: "Smartphone",
      deviceBrand: "Apple",
      deviceModel: "iPhone 13 Pro Max Grafite",
      serialOrImei: "359128091823901",
      reportedDefect: "Display sem imagem após queda no chão. Touch parou de responder.",
      technicalDiagnosis: "Módulo OLED rompido internamente. Placa lógica e FaceID íntegros.",
      entryChecklist: JSON.stringify({
        powers_on: true,
        cracked_screen: true,
        chassis_scratches: true,
        cameras_working: true,
      }),
      totalServices: 250.0,
      totalParts: 890.0,
      totalDiscount: 40.0,
      netTotal: 1100.0,
      items: {
        create: [
          {
            tenantId: tenant.id,
            itemType: "PRODUCT",
            productId: telaIphone13.id,
            description: "Tela OLED Original iPhone 13 Pro Max",
            quantity: 1,
            unitCost: 380.0,
            unitPrice: 890.0,
            totalAmount: 890.0,
            technicianId: techUser.id,
          },
          {
            tenantId: tenant.id,
            itemType: "SERVICE",
            description: "Mão de Obra de Troca de Tela e Vedação IP68",
            quantity: 1,
            unitCost: 0.0,
            unitPrice: 250.0,
            discountAmount: 40.0,
            totalAmount: 210.0,
            technicianId: techUser.id,
          },
        ],
      },
    },
  });

  const os2 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      clientId: client2.id,
      technicianId: techUser.id,
      osNumber: 1002,
      status: OsStatus.IN_MAINTENANCE,
      priority: "NORMAL",
      deviceType: "Smartphone",
      deviceBrand: "Samsung",
      deviceModel: "Galaxy S22 128GB",
      serialOrImei: "998271625412891",
      reportedDefect: "Aparelho desliga ao atingir 30% de carga. Esquenta ao carregar.",
      technicalDiagnosis: "Bateria em degradação severa (vida útil 68%). Conector oxidado.",
      entryChecklist: JSON.stringify({
        powers_on: true,
        cracked_screen: false,
        battery_drain: true,
      }),
      totalServices: 120.0,
      totalParts: 330.0,
      totalDiscount: 0.0,
      netTotal: 450.0,
      items: {
        create: [
          {
            tenantId: tenant.id,
            itemType: "PRODUCT",
            productId: bateriaS22.id,
            description: "Bateria Original Samsung Galaxy S22",
            quantity: 1,
            unitCost: 95.0,
            unitPrice: 240.0,
            totalAmount: 240.0,
            technicianId: techUser.id,
          },
          {
            tenantId: tenant.id,
            itemType: "SERVICE",
            description: "Desoxidação e Calibração de Bateria",
            quantity: 1,
            unitCost: 0.0,
            unitPrice: 120.0,
            totalAmount: 120.0,
            technicianId: techUser.id,
          },
        ],
      },
    },
  });

  console.log(`✅ Ordens de Serviço geradas: OS #${os1.osNumber} (Token Público: ${os1.publicToken}), OS #${os2.osNumber}`);

  // 8. Título financeiro de exemplo
  await prisma.financialTransaction.create({
    data: {
      tenantId: tenant.id,
      transactionType: TransactionType.RECEIVABLE,
      chartOfAccountId: chartRevenue.id,
      clientId: client1.id,
      description: `Entrada / Sinal Orçamento OS #${os1.osNumber}`,
      grossAmount: 300.0,
      netAmount: 300.0,
      competenceDate: new Date(),
      dueDate: new Date(),
      status: TransactionStatus.SETTLED,
      paymentMethod: "PIX",
      bankAccountId: bankItau.id,
      settlementDate: new Date(),
    },
  });

  console.log("🎉 Seed do TorxOS concluído com total sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
