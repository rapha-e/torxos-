// ============================================================================
// TorxOS — API Client & Mock State Manager (Com Failover Automático & Sessão)
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// Armazenamento de token local com retrocompatibilidade
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("torxos_token") || localStorage.getItem("evorix_token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("torxos_token", token);
    localStorage.setItem("evorix_token", token);
  }
}

export function clearAllTenantCache() {
  if (typeof window !== "undefined") {
    const keys = [
      "torxos_token",
      "torxos_user",
      "torxos_super_admin_backup",
      "torxos_company_profile",
      "torxos_stock_products",
      "torxos_service_orders",
      "torxos_financial_transactions",
      "torxos_sales",
      "torxos_kanban_state",
      "evorix_token",
      "evorix_user",
      "evorix_super_admin_backup",
      "evorix_stock_products",
      "evorix_service_orders",
      "evorix_financial_transactions",
      "evorix_sales",
      "evorix_kanban_state",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  }
}

export function removeAuthToken() {
  clearAllTenantCache();
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("torxos_user") || localStorage.getItem("evorix_user");
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Inicialização de sessão
async function ensureSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("torxos_token") || localStorage.getItem("evorix_token");
  return token || null;
}

// Cliente Fetch Resiliente com controle de sessão real
export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Se token expirou ou é inválido, limpa sessão e força login
    if (res.status === 401 && !endpoint.includes("/auth/login")) {
      removeAuthToken();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Sessão expirada. Por favor, faça login novamente.");
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    // Se for listagem de produtos com sucesso, sincroniza no cache local
    if (endpoint.includes("/stock/products") && Array.isArray(data)) {
      if (typeof window !== "undefined") {
        localStorage.setItem("evorix_stock_products", JSON.stringify(data));
      }
    }

    // Se for listagem ou criação de transações financeiras, sincroniza no cache local
    if (endpoint.includes("/finance/transactions")) {
      if (typeof window !== "undefined") {
        if (Array.isArray(data)) {
          localStorage.setItem("evorix_financial_transactions", JSON.stringify(data));
        } else if (data && data.id) {
          const current = getLocalFinancialTransactions();
          const filtered = current.filter((t: any) => t.id !== data.id);
          localStorage.setItem("evorix_financial_transactions", JSON.stringify([data, ...filtered]));
        }
      }
    }

    // Se for criação ou listagem de ordens de serviço, sincroniza no cache local
    if (endpoint.includes("/service-orders")) {
      if (typeof window !== "undefined") {
        if (options.method === "POST" && data && data.id) {
          localStorage.removeItem("evorix_kanban_state");
          const current = getLocalServiceOrders();
          const filtered = current.filter((o: any) => o.id !== data.id && o.osNumber !== data.osNumber);
          localStorage.setItem("evorix_service_orders", JSON.stringify([data, ...filtered]));
        } else if (options.method === "PATCH" && endpoint.includes("/status")) {
          const parts = endpoint.split("/");
          const statusIdx = parts.indexOf("status");
          const targetId = statusIdx > 0 ? parts[statusIdx - 1] : null;
          let newStatus = (data && data.status) || null;
          if (!newStatus && options.body) {
            try {
              newStatus = JSON.parse(options.body as string).status;
            } catch (e) {}
          }
          if (targetId && newStatus) {
            const current = getLocalServiceOrders();
            const updated = current.map((o: any) =>
              o.id === targetId || o.publicToken === targetId || String(o.osNumber) === targetId
                ? { ...o, status: newStatus }
                : o
            );
            localStorage.setItem("evorix_service_orders", JSON.stringify(updated));
          }
        }
      }
    }

    return data;
  } catch (error: any) {
    console.warn(`[TORXOS API FAILOVER] ${endpoint}: ${error.message}. Usando dados persistidos/demonstração.`);
    return getFallbackData(endpoint, options) as T;
  }
}

// Funções de gerenciamento de estoque local resiliente
function getLocalStockList() {
  const defaultItems = [
    {
      id: "prod-001",
      sku: "TEL-IPH13-OLED",
      name: "Tela OLED Original iPhone 13 Pro Max",
      category: "Telas e Displays",
      brand: "Apple",
      currentStock: 2,
      costPrice: 380.0,
      salePrice: 890.0,
      shelfLocation: "Gaveta B-04",
      stockoutRiskStatus: "CRITICAL",
    },
    {
      id: "prod-002",
      sku: "BAT-SAMS22-ORIG",
      name: "Bateria Original Samsung Galaxy S22",
      category: "Baterias",
      brand: "Samsung",
      currentStock: 5,
      costPrice: 95.0,
      salePrice: 240.0,
      shelfLocation: "Gaveta A-12",
      stockoutRiskStatus: "WARNING",
    },
    {
      id: "prod-003",
      sku: "CON-USBC-UNIV",
      name: "Conector de Carga USB-C Universal SMD",
      category: "Conectores",
      brand: "Generic",
      currentStock: 45,
      costPrice: 8.0,
      salePrice: 90.0,
      shelfLocation: "Gaveta C-01",
      stockoutRiskStatus: "HEALTHY",
    },
    {
      id: "prod-004",
      sku: "CAP-IPH13-MAG",
      name: "Capa Anti-impacto MagSafe iPhone 13/14",
      category: "Acessórios",
      brand: "TorxOS Protec",
      currentStock: 18,
      costPrice: 18.0,
      salePrice: 65.0,
      shelfLocation: "Balcão - Gôndola A",
      stockoutRiskStatus: "HEALTHY",
    },
    {
      id: "prod-005",
      sku: "PEL-9D-PRIV",
      name: "Película 9D Cerâmica Privacidade Antiespião",
      category: "Acessórios",
      brand: "Glass Pro",
      currentStock: 30,
      costPrice: 6.5,
      salePrice: 35.0,
      shelfLocation: "Balcão - Gaveta 01",
      stockoutRiskStatus: "HEALTHY",
    },
    {
      id: "prod-006",
      sku: "CAR-20W-HOM",
      name: "Fonte Carregador Turbo 20W USB-C Homologado Anatel",
      category: "Eletrônicos",
      brand: "Hrebos",
      currentStock: 12,
      costPrice: 28.0,
      salePrice: 89.0,
      shelfLocation: "Balcão - Gôndola B",
      stockoutRiskStatus: "HEALTHY",
    },
    {
      id: "prod-007",
      sku: "FON-TWS-PRO",
      name: "Fone de Ouvido Bluetooth TWS Pro Cancelamento Ruído",
      category: "Eletrônicos",
      brand: "Lenovo",
      currentStock: 8,
      costPrice: 45.0,
      salePrice: 149.0,
      shelfLocation: "Vitrine 02",
      stockoutRiskStatus: "HEALTHY",
    },
    {
      id: "prod-008",
      sku: "CEL-XIA-RN13",
      name: "Smartphone Xiaomi Redmi Note 13 256GB / 8GB RAM Preto",
      category: "Celulares e Smartphones",
      brand: "Xiaomi",
      currentStock: 3,
      costPrice: 1050.0,
      salePrice: 1390.0,
      shelfLocation: "Cofre Balcão",
      stockoutRiskStatus: "WARNING",
    },
  ];

  if (typeof window === "undefined") return defaultItems;

  const saved = localStorage.getItem("evorix_stock_products");
  if (!saved) {
    localStorage.setItem("evorix_stock_products", JSON.stringify(defaultItems));
    return defaultItems;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultItems;
  } catch {
    return defaultItems;
  }
}

// Funções de gerenciamento de vendas de balcão local resiliente
export function getLocalSalesList() {
  const defaultSales = [
    {
      id: "sale-1001",
      saleNumber: 1001,
      totalAmount: 154.0,
      discountAmount: 0.0,
      netTotal: 154.0,
      paymentMethod: "PIX",
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
      client: { name: "Marcos Vinicius Ribeiro", phone: "(11) 98765-4321" },
      seller: { name: "Raphael Gestor" },
      items: [
        {
          id: "item-1",
          quantity: 1,
          unitPrice: 65.0,
          totalAmount: 65.0,
          product: { name: "Capa Anti-impacto MagSafe iPhone 13/14" },
        },
        {
          id: "item-2",
          quantity: 1,
          unitPrice: 89.0,
          totalAmount: 89.0,
          product: { name: "Fonte Carregador Turbo 20W USB-C Homologado Anatel" },
        },
      ],
    },
  ];

  if (typeof window === "undefined") return defaultSales;

  const saved = localStorage.getItem("evorix_sales");
  if (!saved) {
    localStorage.setItem("evorix_sales", JSON.stringify(defaultSales));
    return defaultSales;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultSales;
  } catch {
    return defaultSales;
  }
}

// Funções de gerenciamento de títulos e financeiro local resiliente
export function getLocalFinancialTransactions() {
  const defaultTransactions = [
    { id: "1", description: "Recebimento OS #1042 - iPhone 13 Pro Max", transactionType: "RECEIVABLE", netAmount: 1100.0, dueDate: "2026-09-05", status: "PENDING", paymentMethod: "PIX", client: { name: "Mariana Alcantara" } },
    { id: "2", description: "Comissão Técnico Lucas - OS #1042", transactionType: "PAYABLE", netAmount: 165.0, dueDate: "2026-10-05", status: "PENDING", paymentMethod: "PIX" },
    { id: "3", description: "Distribuidor Telas e Peças SP - Lote 89", transactionType: "PAYABLE", netAmount: 3800.0, dueDate: "2026-09-08", status: "PENDING", paymentMethod: "BOLETO" },
    { id: "4", description: "Recebimento Balcão OS #1030 - MacBook Pro", transactionType: "RECEIVABLE", netAmount: 1450.0, dueDate: "2026-09-04", status: "SETTLED", paymentMethod: "CREDIT_CARD", client: { name: "Amanda Prado" } },
  ];

  if (typeof window === "undefined") return defaultTransactions;

  const saved = localStorage.getItem("evorix_financial_transactions");
  if (!saved) {
    localStorage.setItem("evorix_financial_transactions", JSON.stringify(defaultTransactions));
    return defaultTransactions;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultTransactions;
  } catch {
    return defaultTransactions;
  }
}

// Funções de gerenciamento de Ordens de Serviço local resiliente
export function getLocalServiceOrders() {
  const defaultTenant = {
    tradeName: "TorxOS Tech Center - Matriz",
    legalName: "TorxOS Soluções em Tecnologia e Manutenção LTDA",
    document: "12.345.678/0001-99",
    phone: "(11) 98888-7766",
    email: "contato@torxos.com.br",
  };

  const defaultOrders = [
    {
      id: "os-001",
      osNumber: 1042,
      publicToken: "demo-token-iphone13",
      status: "AWAITING_APPROVAL",
      priority: "URGENT",
      client: {
        id: "cli-001",
        name: "Mariana Alcantara Silva",
        phone: "(11) 97123-4455",
        document: "345.678.912-00",
        email: "mariana.alcantara@gmail.com",
      },
      tenant: defaultTenant,
      technician: { id: "tech-01", name: "Lucas Técnico Especialista", email: "lucas@torxos.com.br" },
      deviceType: "Smartphone",
      deviceBrand: "Apple",
      deviceModel: "iPhone 13 Pro Max Grafite",
      serialOrImei: "358941098471923",
      reportedDefect: "Display sem imagem após queda no chão. Touch travado.",
      technicalDiagnosis: "Módulo display OLED rompido na trilha condutora interna. Sensor FaceID intacto. Necessária substituição de tela com reprogramação de TrueTone.",
      totalServices: 210.0,
      totalParts: 890.0,
      totalDiscount: 0.0,
      netTotal: 1100.0,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      items: [
        {
          id: "item-os-1",
          itemType: "PRODUCT",
          description: "Tela OLED Original iPhone 13 Pro Max (Genuína)",
          quantity: 1,
          unitPrice: 890.0,
          unitCost: 380.0,
          totalAmount: 890.0,
        },
        {
          id: "item-os-2",
          itemType: "SERVICE",
          description: "Mão de Obra de Troca de Tela e Vedação IP68",
          quantity: 1,
          unitPrice: 210.0,
          unitCost: 0.0,
          totalAmount: 210.0,
        },
      ],
    },
    {
      id: "os-002",
      osNumber: 1040,
      publicToken: "demo-token-sams22",
      status: "IN_MAINTENANCE",
      priority: "NORMAL",
      client: {
        id: "cli-002",
        name: "Carlos Eduardo Ferreira",
        phone: "(11) 98234-9988",
        document: "219.876.543-11",
        email: "carlos.eduardo@hotmail.com",
      },
      tenant: defaultTenant,
      technician: { id: "tech-01", name: "Lucas Técnico Especialista", email: "lucas@torxos.com.br" },
      deviceType: "Smartphone",
      deviceBrand: "Samsung",
      deviceModel: "Galaxy S22 128GB",
      serialOrImei: "990012384756201",
      reportedDefect: "Bateria estufada e desligamentos repentinos.",
      technicalDiagnosis: "Bateria com ciclo esgotado (890 ciclos) e degradação eletroquímica. Tampa traseira descolando pela expansão da célula.",
      totalServices: 210.0,
      totalParts: 240.0,
      totalDiscount: 0.0,
      netTotal: 450.0,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      items: [
        {
          id: "item-os-3",
          itemType: "PRODUCT",
          description: "Bateria Original Samsung Galaxy S22",
          quantity: 1,
          unitPrice: 240.0,
          unitCost: 95.0,
          totalAmount: 240.0,
        },
        {
          id: "item-os-4",
          itemType: "SERVICE",
          description: "Mão de Obra Técnica - Troca de Bateria e Teste de Carga",
          quantity: 1,
          unitPrice: 210.0,
          unitCost: 0.0,
          totalAmount: 210.0,
        },
      ],
    },
    {
      id: "os-003",
      osNumber: 1045,
      publicToken: "demo-token-xiaomi12",
      status: "TRIAGE",
      priority: "NORMAL",
      client: {
        id: "cli-003",
        name: "Fernanda Costa",
        phone: "(11) 98833-2211",
        document: "482.193.004-88",
        email: "fernanda.costa@gmail.com",
      },
      tenant: defaultTenant,
      deviceType: "Smartphone",
      deviceBrand: "Xiaomi",
      deviceModel: "Redmi Note 12",
      serialOrImei: "867492019482710",
      reportedDefect: "Aparelho não reconhece chip SIM e esquenta próximo à câmera.",
      technicalDiagnosis: "Pinos do leitor SIM 1 amassados com oxidação residual.",
      totalServices: 180.0,
      totalParts: 0.0,
      totalDiscount: 0.0,
      netTotal: 180.0,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: "item-os-5",
          itemType: "SERVICE",
          description: "Diagnóstico Avançado de RF e Reparo de Leitor SIM",
          quantity: 1,
          unitPrice: 180.0,
          unitCost: 0.0,
          totalAmount: 180.0,
        },
      ],
    },
    {
      id: "os-004",
      osNumber: 1044,
      publicToken: "demo-token-dell5000",
      status: "ANALYSIS",
      priority: "URGENT",
      client: {
        id: "cli-004",
        name: "Roberto Menezes",
        phone: "(11) 97722-1100",
        document: "109.283.746-55",
        email: "roberto.menezes@empresa.com",
      },
      tenant: defaultTenant,
      deviceType: "Notebook",
      deviceBrand: "Dell",
      deviceModel: "Inspiron 15 5000",
      serialOrImei: "BRJ7X92",
      reportedDefect: "Sem imagem na tela, acende led branco e bipa 3 vezes.",
      technicalDiagnosis: "Corrupção de firmware na memória SPI BIOS e oxidação no barramento LVDS.",
      totalServices: 420.0,
      totalParts: 0.0,
      totalDiscount: 0.0,
      netTotal: 420.0,
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      items: [
        {
          id: "item-os-6",
          itemType: "SERVICE",
          description: "Gravação de BIOS SPI e Recuperação de Circuito LVDS",
          quantity: 1,
          unitPrice: 420.0,
          unitCost: 0.0,
          totalAmount: 420.0,
        },
      ],
    },
    {
      id: "os-005",
      osNumber: 1041,
      publicToken: "demo-token-motoedge",
      status: "APPROVED",
      priority: "NORMAL",
      client: {
        id: "cli-005",
        name: "Lucas Silveira",
        phone: "(11) 96655-4433",
        document: "591.203.948-22",
        email: "lucas.silveira@outlook.com",
      },
      tenant: defaultTenant,
      deviceType: "Smartphone",
      deviceBrand: "Motorola",
      deviceModel: "Moto Edge 30",
      serialOrImei: "350918273645109",
      reportedDefect: "Troca de conector tipo C quebrado.",
      technicalDiagnosis: "Conector USB-C com pinagem interna destruída por uso forçado.",
      totalServices: 150.0,
      totalParts: 60.0,
      totalDiscount: 0.0,
      netTotal: 210.0,
      createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      items: [
        {
          id: "item-os-7",
          itemType: "PRODUCT",
          description: "Conector de Carga USB-C Universal SMD",
          quantity: 1,
          unitPrice: 60.0,
          unitCost: 8.0,
          totalAmount: 60.0,
        },
        {
          id: "item-os-8",
          itemType: "SERVICE",
          description: "Serviço de Microssolda e Troca de Sub-placa Dock",
          quantity: 1,
          unitPrice: 150.0,
          unitCost: 0.0,
          totalAmount: 150.0,
        },
      ],
    },
    {
      id: "os-006",
      osNumber: 1038,
      publicToken: "demo-token-ipadair4",
      status: "QUALITY_CHECK",
      priority: "NORMAL",
      client: {
        id: "cli-006",
        name: "Beatriz Nogueira",
        phone: "(11) 95544-3322",
        document: "672.391.028-44",
        email: "beatriz.nogueira@uol.com.br",
      },
      tenant: defaultTenant,
      deviceType: "Tablet",
      deviceBrand: "Apple",
      deviceModel: "iPad Air 4ª Geração",
      serialOrImei: "DMPXL089Q16M",
      reportedDefect: "Substituição do botão Power com TouchID.",
      technicalDiagnosis: "Flex do botão liga/desliga rompido.",
      totalServices: 300.0,
      totalParts: 280.0,
      totalDiscount: 0.0,
      netTotal: 580.0,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      items: [
        {
          id: "item-os-9",
          itemType: "PRODUCT",
          description: "Flex Cabo Power TouchID Original OEM",
          quantity: 1,
          unitPrice: 280.0,
          unitCost: 90.0,
          totalAmount: 280.0,
        },
        {
          id: "item-os-10",
          itemType: "SERVICE",
          description: "Mão de Obra de Desmontagem Térmica e Calibração Biométrica",
          quantity: 1,
          unitPrice: 300.0,
          unitCost: 0.0,
          totalAmount: 300.0,
        },
      ],
    },
    {
      id: "os-007",
      osNumber: 1035,
      publicToken: "demo-token-ps5",
      status: "READY_FOR_PICKUP",
      priority: "LOW",
      client: {
        id: "cli-007",
        name: "Tiago Rocha",
        phone: "(11) 94433-2211",
        document: "782.109.382-77",
        email: "tiago.rocha@gmail.com",
      },
      tenant: defaultTenant,
      deviceType: "Console",
      deviceBrand: "Sony",
      deviceModel: "PlayStation 5 Digital",
      serialOrImei: "03-27451928-892718",
      reportedDefect: "Limpeza preventiva completa e troca de metal líquido.",
      technicalDiagnosis: "Oxidação em área do APU e vazamento parcial de metal líquido por uso prolongado na vertical.",
      totalServices: 250.0,
      totalParts: 100.0,
      totalDiscount: 0.0,
      netTotal: 350.0,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      items: [
        {
          id: "item-os-11",
          itemType: "PRODUCT",
          description: "Composto Térmico Metal Líquido de Alta Condutividade",
          quantity: 1,
          unitPrice: 100.0,
          unitCost: 35.0,
          totalAmount: 100.0,
        },
        {
          id: "item-os-12",
          itemType: "SERVICE",
          description: "Desoxidação, Limpeza Química Ultrassônica e Reaplicação Térmica",
          quantity: 1,
          unitPrice: 250.0,
          unitCost: 0.0,
          totalAmount: 250.0,
        },
      ],
    },
    {
      id: "os-008",
      osNumber: 1030,
      publicToken: "demo-token-macbookm1",
      status: "DELIVERED",
      priority: "NORMAL",
      client: {
        id: "cli-008",
        name: "Amanda Prado",
        phone: "(11) 93322-1100",
        document: "891.029.384-99",
        email: "amanda.prado@icloud.com",
      },
      tenant: defaultTenant,
      deviceType: "Notebook",
      deviceBrand: "Apple",
      deviceModel: "MacBook Pro M1 14\"",
      serialOrImei: "C02G8192MD6R",
      reportedDefect: "Teclado com teclas 'E' e 'Espaço' travadas.",
      technicalDiagnosis: "Teclas emperradas por acúmulo de sujidade e derramamento de café açucarado.",
      totalServices: 600.0,
      totalParts: 850.0,
      totalDiscount: 0.0,
      netTotal: 1450.0,
      deliveredAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      items: [
        {
          id: "item-os-13",
          itemType: "PRODUCT",
          description: "Teclado Original Layout ABNT2 MacBook Pro Retina",
          quantity: 1,
          unitPrice: 850.0,
          unitCost: 390.0,
          totalAmount: 850.0,
        },
        {
          id: "item-os-14",
          itemType: "SERVICE",
          description: "Mão de Obra Especializada - Rebitagem de Carcaça Topcase",
          quantity: 1,
          unitPrice: 600.0,
          unitCost: 0.0,
          totalAmount: 600.0,
        },
      ],
    },
  ];

  if (typeof window === "undefined") return defaultOrders;

  const saved = localStorage.getItem("evorix_service_orders");
  if (!saved) {
    localStorage.setItem("evorix_service_orders", JSON.stringify(defaultOrders));
    return defaultOrders;
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized = parsed.map((o: any) => {
        if (o.osNumber === 1046 && (!o.client?.name || o.client.name === "Cliente Balcão")) {
          return {
            ...o,
            client: {
              ...(o.client || {}),
              name: "Mariana Alcantara",
              phone: o.client?.phone && o.client.phone !== "(11) 99999-9999" ? o.client.phone : "(11) 97123-4455",
            },
          };
        }
        if (o.osNumber === 1047 && (!o.client?.name || o.client.name === "Cliente Balcão")) {
          return {
            ...o,
            client: {
              ...(o.client || {}),
              name: "Rodrigo Mendonça",
              phone: o.client?.phone && o.client.phone !== "(11) 99999-9999" ? o.client.phone : "(11) 98844-3322",
            },
          };
        }
        return o;
      });
      return sanitized;
    }
    return defaultOrders;
  } catch {
    return defaultOrders;
  }
}

// Fallback de dados para garantir experiência interativa fluida
function getFallbackData(endpoint: string, options: RequestInit = {}) {
  // Vendas de Balcão e PDV (/sales)
  if (endpoint.includes("/sales/daily-summary")) {
    const allSales = getLocalSalesList().filter((s: any) => s.status === "COMPLETED");
    const totalRev = allSales.reduce((sum: number, s: any) => sum + Number(s.netTotal || 0), 0);
    const totalQty = allSales.reduce((sum: number, s: any) => {
      const itemsQty = (s.items || []).reduce((q: number, it: any) => q + Number(it.quantity || 1), 0);
      return sum + itemsQty;
    }, 0);

    return {
      date: new Date().toISOString().split("T")[0],
      totalSalesCount: allSales.length,
      totalRevenue: totalRev,
      totalItemsSold: totalQty,
      avgTicket: allSales.length > 0 ? totalRev / allSales.length : 0,
      byPaymentMethod: {
        PIX: totalRev,
        CREDIT_CARD: 0,
        DEBIT_CARD: 0,
        CASH: 0,
      },
    };
  }

  if (endpoint.includes("/sales")) {
    if (options.method === "POST" && options.body) {
      try {
        const payload = JSON.parse(options.body as string);
        const currentSales = getLocalSalesList();
        const currentStock = getLocalStockList();

        const saleNumber = (currentSales[0]?.saleNumber || 1000) + 1;

        // Monta os itens da venda e busca nomes do estoque
        const saleItems = (payload.items || []).map((it: any, idx: number) => {
          const product = currentStock.find((p: any) => p.id === it.productId);
          return {
            id: `item-${Date.now()}-${idx}`,
            productId: it.productId,
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unitPrice || product?.salePrice || 0),
            discountAmount: Number(it.discountAmount || 0),
            totalAmount: Number(it.quantity || 1) * Number(it.unitPrice || product?.salePrice || 0) - Number(it.discountAmount || 0),
            imeiOrSerial: it.imeiOrSerial || undefined,
            product: product || { name: "Produto Avulso" },
          };
        });

        const grossTotal = saleItems.reduce((sum: number, i: any) => sum + i.totalAmount, 0);
        const globalDiscount = Number(payload.discountAmount || 0);
        const netTotal = Math.max(0, grossTotal - globalDiscount);
        const receivedAmount = Number(payload.receivedAmount || netTotal);
        const changeAmount = receivedAmount > netTotal ? receivedAmount - netTotal : 0;

        const newSale = {
          id: `sale-${Date.now()}`,
          saleNumber,
          clientId: payload.clientId || null,
          totalAmount: grossTotal,
          discountAmount: globalDiscount,
          netTotal,
          paymentMethod: payload.paymentMethod || "PIX",
          receivedAmount,
          changeAmount,
          status: "COMPLETED",
          notes: payload.notes || null,
          items: saleItems,
          createdAt: new Date().toISOString(),
          client: payload.clientId ? { name: "Cliente Cadastrado" } : { name: "Consumidor Final" },
          seller: { name: "Raphael Gestor" },
        };

        // 1. BAIXA DE ESTOQUE LOCAL: Decrementa cada item do localStorage
        const updatedStock = currentStock.map((prod: any) => {
          const soldItem = (payload.items || []).find((it: any) => it.productId === prod.id);
          if (soldItem) {
            const newQty = Math.max(0, Number(prod.currentStock || 0) - Number(soldItem.quantity || 1));
            return {
              ...prod,
              currentStock: newQty,
              stockoutRiskStatus: newQty <= 2 ? "CRITICAL" : newQty <= 5 ? "WARNING" : "HEALTHY",
            };
          }
          return prod;
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("evorix_stock_products", JSON.stringify(updatedStock));
          localStorage.setItem("evorix_sales", JSON.stringify([newSale, ...currentSales]));
        }

        // 2. ENTRADA FINANCEIRA LOCAL: Registra receita liquidada (SETTLED) no caixa
        const currentTransactions = getLocalFinancialTransactions();
        const newFinTransaction = {
          id: `trans-sale-${Date.now()}`,
          description: `Venda de Balcão #${saleNumber} (${saleItems.length} itens)`,
          transactionType: "RECEIVABLE",
          grossAmount: netTotal,
          netAmount: netTotal,
          dueDate: new Date().toISOString().split("T")[0],
          competenceDate: new Date().toISOString().split("T")[0],
          settlementDate: new Date().toISOString().split("T")[0],
          status: "SETTLED",
          paymentMethod: payload.paymentMethod || "PIX",
          createdAt: new Date().toISOString(),
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("evorix_financial_transactions", JSON.stringify([newFinTransaction, ...currentTransactions]));
        }

        return newSale;
      } catch (e) {
        return {};
      }
    }
    return getLocalSalesList();
  }
  // Transações Financeiras (Títulos a Pagar / Receber)
  if (endpoint.includes("/finance/transactions")) {
    if (options.method === "POST" && options.body) {
      try {
        const payload = JSON.parse(options.body as string);
        const currentList = getLocalFinancialTransactions();
        const newTransaction = {
          id: `trans-${Date.now()}`,
          description: payload.description,
          transactionType: payload.transactionType || "PAYABLE",
          grossAmount: Number(payload.grossAmount || 0),
          netAmount: Number(payload.grossAmount || 0) - Number(payload.discountAmount || 0) - Number(payload.feeAmount || 0),
          dueDate: payload.dueDate || new Date().toISOString().split("T")[0],
          competenceDate: payload.competenceDate || new Date().toISOString().split("T")[0],
          status: "PENDING",
          paymentMethod: payload.paymentMethod || "PIX",
          createdAt: new Date().toISOString(),
        };

        const updated = [newTransaction, ...currentList];
        if (typeof window !== "undefined") {
          localStorage.setItem("evorix_financial_transactions", JSON.stringify(updated));
        }
        return newTransaction;
      } catch (e) {
        return {};
      }
    }
    return getLocalFinancialTransactions();
  }

  // Catálogo de Estoque (GET, POST, PATCH, DELETE)
  if (endpoint.includes("/stock/products")) {
    const currentList = getLocalStockList();

    // DELETE /stock/products/:id
    if (options.method === "DELETE") {
      const parts = endpoint.split("/");
      const targetId = parts[parts.length - 1];
      const filtered = currentList.filter((p: any) => p.id !== targetId);
      if (typeof window !== "undefined") {
        localStorage.setItem("evorix_stock_products", JSON.stringify(filtered));
      }
      return { success: true };
    }

    // PATCH /stock/products/:id
    if (options.method === "PATCH" && options.body) {
      try {
        const parts = endpoint.split("/");
        const targetId = parts[parts.length - 1];
        const payload = JSON.parse(options.body as string);

        const updated = currentList.map((p: any) => {
          if (p.id === targetId) {
            return {
              ...p,
              ...payload,
              costPrice: payload.costPrice !== undefined ? Number(payload.costPrice) : p.costPrice,
              salePrice: payload.salePrice !== undefined ? Number(payload.salePrice) : p.salePrice,
              currentStock: payload.currentStock !== undefined ? Number(payload.currentStock) : p.currentStock,
              supplierLeadTimeDays: payload.supplierLeadTimeDays !== undefined ? Number(payload.supplierLeadTimeDays) : p.supplierLeadTimeDays,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("evorix_stock_products", JSON.stringify(updated));
        }
        const updatedItem = updated.find((p: any) => p.id === targetId);
        return updatedItem || {};
      } catch (e) {
        return {};
      }
    }

    // POST /stock/products
    if (options.method === "POST" && options.body) {
      try {
        const payload = JSON.parse(options.body as string);
        const newProduct = {
          id: `prod-${Date.now()}`,
          name: payload.name,
          sku: payload.sku || `SKU-${Date.now().toString().slice(-4)}`,
          category: payload.category || "Geral",
          brand: payload.brand || "Geral",
          costPrice: Number(payload.costPrice || 0),
          salePrice: Number(payload.salePrice || 0),
          currentStock: Number(payload.currentStock || 0),
          shelfLocation: payload.shelfLocation || "Bancada Central",
          supplierLeadTimeDays: Number(payload.supplierLeadTimeDays || 3),
          stockoutRiskStatus: "HEALTHY",
          createdAt: new Date().toISOString(),
        };

        const updated = [newProduct, ...currentList];
        if (typeof window !== "undefined") {
          localStorage.setItem("evorix_stock_products", JSON.stringify(updated));
        }
        return newProduct;
      } catch (e) {
        return {};
      }
    }
    return getLocalStockList();
  }

  // Kanban de Bancada
  if (endpoint.includes("/service-orders/kanban")) {
    const orders = getLocalServiceOrders();
    const columns: Record<string, any[]> = {
      TRIAGE: [],
      ANALYSIS: [],
      AWAITING_APPROVAL: [],
      APPROVED: [],
      IN_MAINTENANCE: [],
      AWAITING_PARTS: [],
      QUALITY_CHECK: [],
      READY_FOR_PICKUP: [],
      DELIVERED: [],
      CANCELED: [],
    };

    for (const order of orders) {
      let statusKey = order.status || "TRIAGE";
      if (statusKey === "AWAITING_PARTS") {
        statusKey = "APPROVED";
      }
      if (columns[statusKey]) {
        columns[statusKey].push({ ...order, status: statusKey });
      }
    }

    return columns;
  }

  // Atualização de Status da OS (/service-orders/:id/status)
  if (endpoint.includes("/service-orders/") && endpoint.includes("/status") && options.method === "PATCH") {
    const parts = endpoint.split("/");
    const statusIdx = parts.indexOf("status");
    const targetId = statusIdx > 0 ? parts[statusIdx - 1] : null;
    let newStatus = "TRIAGE";
    if (options.body) {
      try {
        const parsed = JSON.parse(options.body as string);
        if (parsed.status) newStatus = parsed.status;
      } catch (e) {}
    }

    const allOrders = getLocalServiceOrders();

    // Se estiver movendo para IN_MAINTENANCE, valida estoque das peças
    if (newStatus === "IN_MAINTENANCE") {
      const targetOrder = allOrders.find(
        (o: any) => o.id === targetId || o.publicToken === targetId || String(o.osNumber) === targetId
      );
      if (targetOrder && Array.isArray(targetOrder.items)) {
        const currentStockList = getLocalStockList();
        for (const item of targetOrder.items) {
          if (item.itemType === "PRODUCT" && !item.stockDeducted) {
            const prod = currentStockList.find(
              (p: any) => p.id === item.productId || (p.name && item.description && p.name.trim().toLowerCase() === item.description.trim().toLowerCase())
            );
            const avail = prod ? Number(prod.currentStock || 0) : 0;
            const req = Number(item.quantity || 1);
            if (avail < req) {
              throw new Error(`Estoque insuficiente para a peça "${item.description || prod?.name || 'solicitada'}". Disponível em estoque: ${avail}, Necessário: ${req}. A OS não pode entrar em bancada até a reposição.`);
            }
          }
        }
      }
    }

    const updatedOrders = allOrders.map((o: any) => {
      if (o.id === targetId || o.publicToken === targetId || String(o.osNumber) === targetId) {
        return {
          ...o,
          status: newStatus,
          stockDeducted: newStatus === "IN_MAINTENANCE" ? true : (newStatus === "CANCELED" ? false : o.stockDeducted),
        };
      }
      return o;
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("evorix_service_orders", JSON.stringify(updatedOrders));
      localStorage.removeItem("evorix_kanban_state");
    }

    return { id: targetId, status: newStatus };
  }

  // Consulta detalhada de uma OS (/service-orders/:id ou publicToken)
  const osIdMatch = endpoint.match(/\/service-orders\/([^?]+)/);
  if (osIdMatch && !endpoint.includes("/kanban")) {
    const requestedId = osIdMatch[1];
    const allOrders = getLocalServiceOrders();
    const found = allOrders.find(
      (o: any) =>
        o.id === requestedId ||
        o.publicToken === requestedId ||
        o.osNumber?.toString() === requestedId ||
        requestedId.endsWith(o.id)
    );
    if (found) return found;
    return allOrders[0] || {};
  }

  // Cadastro e consulta de clientes (/clients)
  if (endpoint.includes("/clients")) {
    if (options.method === "POST" && options.body) {
      try {
        const payload = JSON.parse(options.body as string);
        return {
          id: `cli-${Date.now()}`,
          name: payload.name || "Cliente Balcão",
          phone: payload.phone || "(11) 99999-9999",
          document: payload.document || null,
          email: payload.email || null,
        };
      } catch (e) {
        return { id: `cli-${Date.now()}`, name: "Cliente Balcão" };
      }
    }
  }

  // Lista geral de OSs (/service-orders)
  if (endpoint.includes("/service-orders")) {
    const currentOrders = getLocalServiceOrders();

    // POST /service-orders (Abertura de nova OS)
    if (options.method === "POST" && options.body) {
      try {
        const payload = JSON.parse(options.body as string);
        const nextNumber = (Math.max(...currentOrders.map((o: any) => Number(o.osNumber) || 1040), 1045)) + 1;
        const tempId = `os-${Date.now()}`;

        const createdItems = (payload.items || []).map((it: any, idx: number) => ({
          id: `item-new-${idx}-${Date.now()}`,
          itemType: it.itemType || "SERVICE",
          description: it.description,
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
          totalAmount: (Number(it.quantity || 1) * Number(it.unitPrice || 0)),
        }));

        const totalServices = createdItems
          .filter((i: any) => i.itemType === "SERVICE")
          .reduce((sum: number, i: any) => sum + i.totalAmount, 0);

        const totalParts = createdItems
          .filter((i: any) => i.itemType === "PRODUCT")
          .reduce((sum: number, i: any) => sum + i.totalAmount, 0);

        const netTotal = totalServices + totalParts;
        const clientName = (payload.clientName || payload.client?.name || "").trim() || "Cliente Balcão";
        const clientPhone = (payload.clientPhone || payload.client?.phone || "").trim() || "(11) 99999-9999";
        const clientId = payload.clientId || `cli-${Date.now()}`;

        const newOs = {
          id: tempId,
          osNumber: nextNumber,
          publicToken: `token-${Date.now()}`,
          status: "TRIAGE",
          priority: payload.priority || "NORMAL",
          client: {
            id: clientId,
            name: clientName,
            phone: clientPhone,
          },
          tenant: {
            tradeName: "TorxOS Tech Center - Matriz",
            legalName: "TorxOS Soluções em Tecnologia e Manutenção LTDA",
            document: "12.345.678/0001-99",
            phone: "(11) 98888-7766",
            email: "contato@torxos.com.br",
          },
          technician: { name: "Lucas Técnico Especialista" },
          deviceType: payload.deviceType || "Smartphone",
          deviceBrand: payload.deviceBrand || "Geral",
          deviceModel: payload.deviceModel || "Equipamento",
          serialOrImei: payload.serialOrImei || null,
          reportedDefect: payload.reportedDefect || "Defeito a diagnosticar",
          totalServices,
          totalParts,
          netTotal,
          items: createdItems,
          createdAt: new Date().toISOString(),
        };

        const updated = [newOs, ...currentOrders];
        if (typeof window !== "undefined") {
          localStorage.removeItem("evorix_kanban_state");
          localStorage.setItem("evorix_service_orders", JSON.stringify(updated));
        }
        return newOs;
      } catch (e) {
        return {};
      }
    }

    return currentOrders;
  }

  if (endpoint.includes("/stock/predictions/stockouts")) {
    return [
      {
        id: "prod-1",
        name: "Tela OLED Original iPhone 13 Pro Max",
        sku: "TEL-IPH13-OLED",
        category: "Telas e Displays",
        currentStock: 2,
        dailyAvgConsumption: 1.2,
        daysUntilStockout: 1,
        supplierLeadTimeDays: 4,
        safetyStockCalculated: 3,
        reorderPointCalculated: 7,
        stockoutRiskStatus: "CRITICAL",
        shelfLocation: "Gaveta B-04",
        costPrice: 380.0,
        salePrice: 890.0,
      },
      {
        id: "prod-2",
        name: "Bateria Original Samsung Galaxy S22",
        sku: "BAT-SAMS22-ORIG",
        category: "Baterias",
        brand: "Samsung",
        currentStock: 5,
        dailyAvgConsumption: 0.8,
        daysUntilStockout: 6,
        supplierLeadTimeDays: 3,
        safetyStockCalculated: 2,
        reorderPointCalculated: 5,
        stockoutRiskStatus: "WARNING",
        shelfLocation: "Gaveta A-12",
        costPrice: 95.0,
        salePrice: 240.0,
      },
    ];
  }

  if (endpoint.includes("/finance/reports/dre")) {
    return {
      period: { startDate: "01/09/2026", endDate: "30/09/2026" },
      summary: {
        grossRevenue: 48950.0,
        deductions: 1420.0,
        netRevenue: 47530.0,
        directCosts: 16840.0,
        grossProfit: 30690.0,
        operatingExpenses: 11200.0,
        netProfit: 19490.0,
        netMarginPercent: 41.01,
      },
      breakdown: [],
    };
  }

  if (endpoint.includes("/finance/reports/cash-flow")) {
    const allTransactions = getLocalFinancialTransactions();
    const pending = allTransactions.filter((t: any) => t.status === "PENDING" || !t.status);

    const baseBalance = 25600.0;
    const projectedReceivables = pending
      .filter((t: any) => t.transactionType === "RECEIVABLE")
      .reduce((sum: number, t: any) => sum + Number(t.netAmount || 0), 0);

    const projectedPayables = pending
      .filter((t: any) => t.transactionType === "PAYABLE")
      .reduce((sum: number, t: any) => sum + Number(t.netAmount || 0), 0);

    const projectedFinalBalance = baseBalance + projectedReceivables - projectedPayables;

    const upcoming = [...pending]
      .sort((a: any, b: any) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
      .slice(0, 10);

    return {
      currentTotalBalance: baseBalance,
      projectedReceivables,
      projectedPayables,
      projectedFinalBalance,
      pendingCount: pending.length,
      accounts: [
        { id: "1", name: "Caixa Balcão 1", currentBalance: 1250.0, accountType: "CASH_REGISTER" },
        { id: "2", name: "Itaú Empresas PJ", currentBalance: 24350.0, accountType: "CHECKING_ACCOUNT" },
      ],
      upcomingTransactions: upcoming,
    };
  }

  if (endpoint.includes("/ai-mentor/consult")) {
    let userPrompt = "";
    let pillar = "REVENUE";
    if (options.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        userPrompt = bodyObj.prompt || "";
        pillar = bodyObj.pillar || "REVENUE";
      } catch {}
    }

    const q = userPrompt.toLowerCase();
    const orders = getLocalServiceOrders();
    const stockList = getLocalStockList();
    const finTrans = getLocalFinancialTransactions();

    const inMaintenance = orders.filter((o: any) => o.status === "IN_MAINTENANCE").length;
    const inTriage = orders.filter((o: any) => o.status === "TRIAGE" || o.status === "ANALYSIS").length;
    const inApproved = orders.filter((o: any) => o.status === "APPROVED").length;
    const inQuality = orders.filter((o: any) => o.status === "QUALITY_CHECK").length;
    const inReady = orders.filter((o: any) => o.status === "READY_FOR_PICKUP").length;

    const totalReceivables = finTrans
      .filter((t: any) => t.transactionType === "RECEIVABLE" && t.status === "PENDING")
      .reduce((sum: number, t: any) => sum + Number(t.netAmount || 0), 0);
    const totalPayables = finTrans
      .filter((t: any) => t.transactionType === "PAYABLE" && t.status === "PENDING")
      .reduce((sum: number, t: any) => sum + Number(t.netAmount || 0), 0);

    // Identifica se o usuário citou alguma OS por número
    const osMatch = q.match(/\b(10[3-5][0-9])\b/);
    const targetOsNumber = osMatch ? Number(osMatch[1]) : null;
    const foundOsByNumber = targetOsNumber ? orders.find((o: any) => o.osNumber === targetOsNumber) : null;

    // Identifica se o usuário citou algum cliente por nome
    const foundOsByClient = orders.find((o: any) => {
      const cName = (o.client?.name || "").toLowerCase();
      if (!cName) return false;
      const firstName = cName.split(" ")[0];
      return firstName.length > 2 && q.includes(firstName);
    });

    const targetOs = foundOsByNumber || foundOsByClient;

    let diagnostic = "";

    // 1. CASO ESPECÍFICO: O usuário perguntou sobre uma OS ou Cliente específico
    if (targetOs) {
      const clientName = targetOs.client?.name || "Cliente Balcão";
      const phone = targetOs.client?.phone || "Não cadastrado";
      const device = `${targetOs.deviceBrand || ""} ${targetOs.deviceModel || ""}`.trim();
      const statusLabel =
        targetOs.status === "APPROVED"
          ? "Aprovado (Aguardando entrada em bancada)"
          : targetOs.status === "IN_MAINTENANCE"
          ? "Em Bancada (Conserto ativo)"
          : targetOs.status === "QUALITY_CHECK"
          ? "Controle de Qualidade (Testes finais)"
          : targetOs.status === "READY_FOR_PICKUP"
          ? "Pronto para Retirada"
          : targetOs.status === "ANALYSIS"
          ? "Em Análise / Diagnóstico"
          : targetOs.status;

      const hasStockBlock = targetOs.stockError || (targetOs.osNumber === 1048);
      const partsSummary = (targetOs.items || [])
        .map((it: any) => `  • ${it.itemType === "PRODUCT" ? "📦 [Peça]" : "🔧 [Serviço]"} ${it.description} — R$ ${(Number(it.unitPrice) || 0).toFixed(2)}`)
        .join("\n");

      diagnostic = `### 🎯 Diagnóstico da OS #${targetOs.osNumber} — ${device}
**Status Atual:** ${statusLabel} | **Cliente:** ${clientName} (${phone}) | **Valor Total:** R$ ${(Number(targetOs.netTotal) || 0).toFixed(2)}

${hasStockBlock ? `> ⚠️ **PONTO CRÍTICO:** Esta ordem está com a entrada em bancada bloqueada por saldo insuficiente de peças no **TorxOS Stock** (${targetOs.stockError || "Display zerado"}).` : `> ✅ **SITUAÇÃO:** Aparelho sem pendências de peças, seguindo o fluxo normal do laboratório.`}

---

### 📋 Detalhamento dos Itens & Mão de Obra
${partsSummary || "  • Nenhum item detalhado."}

**Defeito Relatado:** ${targetOs.reportedDefect || "Não informado"}  
**Laudo Técnico:** ${targetOs.technicalDiagnosis || "Aguardando conclusão do teste de bancada"}

---

### ⚡ Plano de Ação Imediato para esta OS
1. ${hasStockBlock ? `**Dar Entrada no Estoque:** Lance o saldo da peça no catálogo para liberar o botão de avançar para bancada.` : `**Conduzir no Kanban:** Avance o status da OS para a próxima etapa assim que o procedimento físico for concluído.`}
2. **Contato com Cliente:** Envie mensagem no WhatsApp para ${clientName} (${phone}) mantendo o alinhamento da entrega.
3. **Faturamento:** Valor líquido previsto a entrar no caixa: **R$ ${(Number(targetOs.netTotal) || 0).toFixed(2)}**.`;

    // 2. CASO ESPECÍFICO: Dúvidas sobre Peças, Estoque, Ruptura ou "Aguardando Peça"
    } else if (
      q.includes("peça") ||
      q.includes("peca") ||
      q.includes("estoque") ||
      q.includes("aguardando") ||
      q.includes("bloquead") ||
      q.includes("saldo") ||
      q.includes("falta")
    ) {
      const ordersWithStockIssue = orders.filter((o: any) => o.stockError || o.osNumber === 1048);

      if (ordersWithStockIssue.length > 0) {
        const issuesList = ordersWithStockIssue
          .map((o: any) => {
            const partItem = (o.items || []).find((it: any) => it.itemType === "PRODUCT") || {
              description: "Display original samsung A70",
            };
            return `• **OS #${o.osNumber} — ${o.deviceBrand || ""} ${o.deviceModel || "Aparelho"}** (Cliente: ${o.client?.name || "Cliente"})
  - **Status Atual:** Aprovado (bloqueado para bancada)
  - **Peça Faltante:** *${partItem.description}*
  - **Saldo em Estoque:** 0 un. (Necessário: 1 un.)
  - **Receita Represada:** R$ ${(Number(o.netTotal) || 350).toFixed(2)}`;
          })
          .join("\n\n");

        diagnostic = `### 🎯 Diagnóstico de Peças & Estoque de Bancada
**Sim, temos exatamente ${ordersWithStockIssue.length} Ordem de Serviço com pendência de estoque:**

${issuesList}

---

### 💡 Regra Oficial da Bancada TorxOS
> **Diretriz de Fluxo:** A coluna isolada *"Aguardando Peça"* foi descontinuada para evitar gargalos invisíveis. Ordens com falta de saldo permanecem no estágio **Aprovado** com o selo vermelho **⚠️ Sem estoque**.

---

### 📋 Cartões de Ação Imediata
1. **Entrada de Estoque:** Acesse o menu **TorxOS Stock** e faça a entrada da peça (*Display original samsung A70*) para restabelecer o saldo.
2. **Avanço Automático:** Assim que houver saldo no estoque, arraste a OS para **"Em Bancada"**. A baixa física ocorrerá de forma segura e sem duplicidade.
3. **Notificação Proativa:** Se a peça demandar prazo de entrega do fornecedor, envie aviso via WhatsApp ao cliente.`;
      } else {
        diagnostic = `### 🎯 Diagnóstico de Peças & Estoque de Bancada
**Não há nenhuma Ordem de Serviço bloqueada por falta de peças no momento.**

Todas as ordens aprovadas possuem insumos disponíveis ou já tiveram suas peças baixadas com sucesso.`;
      }

    // 3. CASO ESPECÍFICO: Finanças, Faturamento, Caixa, Contas a Pagar / Receber
    } else if (
      q.includes("fatur") ||
      q.includes("caixa") ||
      q.includes("receber") ||
      q.includes("pagar") ||
      q.includes("financeiro") ||
      q.includes("dre") ||
      q.includes("saldo") ||
      pillar === "FINANCE"
    ) {
      diagnostic = `### 🎯 Diagnóstico Financeiro & Fluxo de Caixa Real
Panorama de liquidez consolidado da sua operação:
- **Títulos a Receber (Previstos):** R$ ${totalReceivables > 0 ? totalReceivables.toFixed(2) : "18.450,00"}
- **Títulos a Pagar (Previstos):** R$ ${totalPayables > 0 ? totalPayables.toFixed(2) : "9.200,00"}
- **Resultado Operacional Projetado:** **+ R$ 9.250,00** (cobertura positiva de caixa)
- **Ticket Médio Consolidado:** **R$ 495,00** por Ordem de Serviço

---

### ⚡ Capital Parado na Oficina
1. **OSs Prontas para Retirada:** Existem R$ 350,00 na OS #1035 (PS5 do Tiago Rocha) e R$ 580,00 na OS #1038 (iPad Air da Beatriz) quase concluída. São **R$ 930,00 de injeção direta de caixa** pronta para recebimento hoje.
2. **Orçamentos Aprovados:** A OS #1041 (R$ 210,00) e OS #1048 (R$ 350,00) representam **R$ 560,00** aguardando finalização técnica.

---

### 📋 Cartões de Ação Imediata (Execute Hoje)
1. **Cobrança de Retirada:** Dispare mensagem com link de pagamento PIX para o Tiago Rocha retirar o PS5 Digital hoje.
2. **Priorizar OS #1044:** Conclua o laudo da OS urgente do Dell Inspiron (R$ 420,00 de mão de obra pura com 100% de margem).
3. **Conciliação Noturna:** Registre as sangrias de balcão para fechar o DRE de setembro sem distorção.`;

    // 4. CASO ESPECÍFICO: Lucro, Margem, Comissões e Custos
    } else if (q.includes("lucro") || q.includes("margem") || q.includes("custo") || q.includes("comissão") || pillar === "PROFIT") {
      diagnostic = `### 🎯 Diagnóstico de Margem Real & Lucratividade
- **Margem Bruta Média:** **62%**
- **Margem Líquida Real:** **41%** (após descontar peças, taxas de cartão e custos de bancada)
- **Serviço Mais Rentável da Semana:** OS #1030 (MacBook Pro M1 da Amanda Prado) — Faturou R$ 1.450,00 com lucro líquido de **R$ 899,00**.

---

### ⚡ Vazamentos Críticos Mapeados
1. **Telas e Displays:** Margem em telas gira em 45%. Para elevar o lucro, vincule sempre a venda da película 3D no balcão (custo R$ 4,50, venda R$ 45,00 = margem de 900%).
2. **Peças sem Giro:** Evite estoque parado de baterias de modelos antigos. Mantenha capital livre para comprar telas de alta rotatividade.

---

### 📋 Cartões de Ação Imediata
1. **Comissão Saudável:** Aplique comissão sobre o lucro da mão de obra, com trava de retenção se houver garantia em 30 dias.
2. **Upsell Obrigatório na Entrega:** Oriente o atendente a oferecer cabo homologado ou película para cada aparelho entregue.`;

    // 5. CASO ESPECÍFICO: Rotina de Bancada, Fila, Gargalos, O que fazer hoje
    } else if (q.includes("bancada") || q.includes("rotina") || q.includes("hoje") || q.includes("prioridade") || q.includes("gargalo") || pillar === "ROUTINE") {
      diagnostic = `### 🎯 Escala Operacional da Bancada Técnica para Hoje
Raio-X de bancada com **${orders.length} Ordens Ativas sob gestão**:

1. 🚨 **Prioridade 1 (Urgente):** **OS #1044 — Dell Inspiron 15** (Roberto Menezes)
   - Falha de BIOS / Linha LVDS sem imagem. R$ 420,00 de mão de obra direta. Direcione para o técnico sênior logo no início da manhã.
2. ⚡ **Prioridade 2 (Em Bancada):** **OS #1040 — Galaxy S22** (Carlos Eduardo)
   - Bateria estufada substituída. Realizar ciclo de carga de 45 min e encaminhar para o Controle de Qualidade.
3. 🔍 **Prioridade 3 (Teste Final):** **OS #1038 — iPad Air** (Beatriz Nogueira)
   - Flex de Power e TouchID trocado. Liberar para a recepção assim que o checklist de biometria concluir.
4. 📦 **Prioridade 4 (Destravar Estoque):** **OS #1048 — Samsung A70** (Pedro)
   - Lançar a entrada do display no TorxOS Stock para puxar o aparelho para conserto.

---

### 📋 Cartões de Ação Imediata
1. **Rito Matinal de 10 min:** Reúna a equipe técnica às 08:30 e delegue as 3 primeiras OSs da lista.
2. **Meta de Saída:** Liberar no mínimo R$ 1.350,00 em aparelhos concluídos até o fechamento da loja.`;

    // 6. CASO GERAL: Estratégia Comercial & Atendimento
    } else {
      diagnostic = `### 🎯 Diagnóstico Executivo de Gestão & Conversão
Com base nos dados ativos do seu laboratório: temos **${orders.length} Ordens de Serviço** registradas, Ticket Médio de **R$ 495,00** e **R$ 18.450,00 em recebíveis projetados**.

Respondendo diretamente a: **"${userPrompt}"**

---

### ⚡ Diagnóstico Factual do Seu Laboratório
1. **Bancada em Fluxo Positivo:** 1 OS em bancada ativa, 1 em teste de qualidade e 2 ordens prontas/aprovadas.
2. **Atenção ao Ponto Crítico:** A OS #1048 (Samsung A70 do cliente Pedro) é a única com pendência de insumo (display zerado).
3. **Liquidez Imediata:** A OS #1035 (PlayStation 5 do Tiago Rocha) está pronta aguardando apenas o cliente buscar no balcão para creditar R$ 350,00 no caixa.

---

### 📋 Cartões de Ação Imediata
1. **Notificação de Balcão:** Dispare mensagem via WhatsApp para os clientes de ordens prontas acelerarem a retirada.
2. **Reposição Pontual:** Solicite ao fornecedor o display do A70 para não deixar o cliente Pedro aguardando.
3. **Padrão de Qualidade:** Mantenha a blindagem de garantia de 90 dias com peças homologadas para sustentar a margem de 62%.`;
    }

    return {
      sessionId: `mock-session-${Date.now()}`,
      pillar,
      response: diagnostic,
      createdAt: new Date().toISOString(),
    };
  }

  if (endpoint.includes("/ai-mentor/daily-briefing")) {
    return {
      title: "Briefing Executivo Diário — TorxOS AI",
      briefing: `### 🚀 Bom dia, Gestor! Aqui está o raio-x da sua operação hoje:

1. **⚠️ Alerta Vermelho de Ruptura (Peça Crítica):**
   A *Tela OLED iPhone 13 Pro Max* possui apenas **2 unidades** com previsão de zerar em **1 dia**. Como o lead time do fornecedor é de 4 dias, emita a ordem de reposição hoje pela manhã para não paralisar novos serviços.

2. **⚡ Oportunidade de Caixa:**
   Você tem **R$ 3.800 em títulos a pagar** com vencimento nos próximos dias e **R$ 5.400 em OSs na bancada prontas ou aguardando aprovação**. Notifique os clientes com o link público para acelerar a liquidação.

3. **🔧 Otimização de Bancada:**
   Duas ordens de serviço estão em triagem há mais de 24h. Reatribua para o técnico Lucas destravar os diagnósticos.`,
      kpis: {
        totalServiceOrders: 28,
        ticketMedio: 540.0,
        produtosEmRiscoRuptura: 2,
        contasAPagar15Dias: 9200.0,
        contasAReceber15Dias: 18450.0,
      },
    };
  }

  return {};
}
