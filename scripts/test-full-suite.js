/**
 * TorxOS — Suíte de Testes Gerais de Pré-Deploy (VPS Ready Check)
 * Executa bateria completa de testes de regras de negócio, limites e isolamento.
 */

const API_BASE = "http://localhost:3001/api/v1";

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;
  if (options.method && options.method !== "GET") {
    headers["Content-Type"] = "application/json";
    if (!body) {
      body = "{}";
    }
  }
  const res = await fetch(url, {
    ...options,
    body,
    headers,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✅ ${message}`);
}

async function run() {
  console.log("================================================================================");
  console.log("🚀 INICIANDO BATERIA GERAL DE TESTES DO TORXOS (PRÉ-DEPLOY VPS)");
  console.log("================================================================================\n");

  const timestamp = Date.now();
  const rand = () => Math.floor(Math.random() * 899999 + 100000);
  const randId = () => Math.random().toString(36).substring(2, 8);

  // ---------------------------------------------------------------------------
  // TESTE 1: Cadastro de Tenant Starter & Isolamento
  // ---------------------------------------------------------------------------
  console.log("▶ [TESTE 1/7] Auto-Cadastro de Empresa (Starter) e Isolamento Multi-Tenant...");
  const starterEmail = `dono.starter.${randId()}.${timestamp}@teste.com`;
  const registerStarterRes = await request(`${API_BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      tradeName: `SmartFix Lab ${randId()}`,
      document: `${rand().toString().slice(0, 2)}.${rand().toString().slice(0, 3)}.${rand().toString().slice(0, 3)}/0001-${rand().toString().slice(0, 2)}`,
      phone: "(11) 98888-0000",
      name: "Gestor Starter",
      email: starterEmail,
      password: "password123",
      plan: "STARTER",
    }),
  });

  assert(registerStarterRes.status === 201, `Cadastro do lojista Starter realizado com status 201 (Recebido: ${registerStarterRes.status})`);
  const starterToken = registerStarterRes.data.accessToken;
  const starterTenantId = registerStarterRes.data.user.tenantId;
  assert(!!starterToken, "Access Token JWT gerado para o novo lojista");

  const starterSettings = await request(`${API_BASE}/tenant/settings`, {
    headers: { Authorization: `Bearer ${starterToken}` },
  });
  assert(starterSettings.status === 200, "Consulta de configurações do tenant isolado retornou 200");
  assert(starterSettings.data.plan === "STARTER", `Plano do tenant confirmado como STARTER`);

  // ---------------------------------------------------------------------------
  // TESTE 2: Limitação de Usuários no Plano Starter (Máx 2 membros)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [TESTE 2/7] Validação de Limite de Usuários do Plano STARTER (Limite = 2)...");
  // Já tem 1 (o dono). Vamos adicionar o 2º usuário:
  const user2Res = await request(`${API_BASE}/tenant/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${starterToken}` },
    body: JSON.stringify({
      name: "Técnico Bancada 1",
      email: `tec1.${timestamp}@teste.com`,
      role: "TECHNICIAN",
      password: "password123",
      commissionRate: 10,
    }),
  });
  assert(user2Res.status === 201, `2º usuário cadastrado com sucesso (limite atingido)`);

  // Tenta adicionar o 3º usuário (deve ser bloqueado):
  const user3Res = await request(`${API_BASE}/tenant/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${starterToken}` },
    body: JSON.stringify({
      name: "Técnico Bancada 2 Excedente",
      email: `tec2.${timestamp}@teste.com`,
      role: "TECHNICIAN",
      password: "password123",
      commissionRate: 10,
    }),
  });
  assert(
    user3Res.status === 403 && (user3Res.data?.code === "PLAN_USER_LIMIT_REACHED" || user3Res.data?.message?.includes("Limite de colaboradores")),
    `3º usuário bloqueado com HTTP 403 e erro PLAN_USER_LIMIT_REACHED (Mensagem: ${user3Res.data?.message})`
  );

  // ---------------------------------------------------------------------------
  // TESTE 3: Bloqueio de Recursos Não Permitidos no Starter (Plan Gates)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [TESTE 3/7] Bloqueio de Recursos Restritos (Mentor IA & Multi-Filiais no Starter)...");
  // Tentar acessar IA Mentor (rota protegida por canUseAiMentor):
  const aiMentorRes = await request(`${API_BASE}/ai-mentor/consult`, {
    method: "POST",
    headers: { Authorization: `Bearer ${starterToken}` },
    body: JSON.stringify({ question: "Como otimizar a bancada?" }),
  });
  assert(
    aiMentorRes.status === 403 && (aiMentorRes.data?.code === "PLAN_UPGRADE_REQUIRED" || aiMentorRes.data?.error === "PLAN_UPGRADE_REQUIRED"),
    `Acesso ao Mentor IA bloqueado com HTTP 403 e PLAN_UPGRADE_REQUIRED`
  );

  // Tentar cadastrar filial no Starter:
  const branchStarterRes = await request(`${API_BASE}/tenant/branches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${starterToken}` },
    body: JSON.stringify({
      tradeName: "Filial Não Permitida",
      document: "11.222.333/0002-99",
      phone: "(11) 97777-1111",
      email: "filial@teste.com",
    }),
  });
  assert(
    branchStarterRes.status === 403 && (branchStarterRes.data?.code === "PLAN_UPGRADE_REQUIRED" || branchStarterRes.data?.error === "PLAN_UPGRADE_REQUIRED"),
    `Cadastro de Filial bloqueado com HTTP 403 e PLAN_UPGRADE_REQUIRED no Starter`
  );

  // ---------------------------------------------------------------------------
  // TESTE 4: Gestão Multi-Filiais & Matriz no Plano ENTERPRISE
  // ---------------------------------------------------------------------------
  console.log("\n▶ [TESTE 4/7] Gestão Multi-Filiais & Matriz no Plano ENTERPRISE...");
  const entId = randId();
  const enterpriseEmail = `dono.enterprise.${entId}.${timestamp}@teste.com`;
  const baseDoc = `${rand().toString().slice(0, 2)}.${rand().toString().slice(0, 3)}.${rand().toString().slice(0, 3)}`;
  const registerEntRes = await request(`${API_BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      tradeName: `TorxOS Matriz Central ${entId}`,
      document: `${baseDoc}/0001-88`,
      phone: "(11) 95555-4444",
      name: "Diretor Matriz",
      email: enterpriseEmail,
      password: "password123",
      plan: "ENTERPRISE",
    }),
  });
  assert(registerEntRes.status === 201, `Loja Matriz Enterprise cadastrada com sucesso`);
  const entToken = registerEntRes.data.accessToken;

  // Cadastrar Filial vinculada à Matriz:
  const createBranchRes = await request(`${API_BASE}/tenant/branches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${entToken}` },
    body: JSON.stringify({
      tradeName: `TorxOS Filial Shopping ${entId}`,
      document: `${baseDoc}/0002-66`,
      phone: "(11) 94444-3333",
      email: `filial.${entId}@teste.com`,
      address: "Shopping Metro Tatuapé, Piso L2",
    }),
  });
  assert(createBranchRes.status === 201, `Filial vinculada cadastrada com sucesso com HTTP 201`);
  const branchId = createBranchRes.data.branch.id;
  assert(createBranchRes.data.branch.parentTenantId !== null, `Filial possui parentTenantId vinculado à Matriz`);

  // Listar Filiais da Rede:
  const listBranchesRes = await request(`${API_BASE}/tenant/branches`, {
    headers: { Authorization: `Bearer ${entToken}` },
  });
  assert(listBranchesRes.status === 200, `Listagem de unidades da rede retornou 200`);
  assert(listBranchesRes.data.headquarter.isHeadquarter === true, `Matriz identificada corretamente como Headquarter`);
  assert(listBranchesRes.data.branches.length >= 1, `Pelo menos 1 filial listada na rede`);

  // Comutar Unidade (Switch Branch) e obter token dinâmico da filial:
  const switchRes = await request(`${API_BASE}/tenant/branches/${branchId}/switch`, {
    method: "POST",
    headers: { Authorization: `Bearer ${entToken}` },
  });
  if (switchRes.status !== 200 && switchRes.status !== 201) {
    console.error("DEBUG switchRes:", JSON.stringify(switchRes));
  }
  assert(switchRes.status === 201 || switchRes.status === 200, `Comutação para Filial respondeu status ${switchRes.status}`);
  assert(switchRes.data?.unit?.id === branchId, `Sessão comutada apontando para a filial ${branchId}`);
  assert(!!switchRes.data?.accessToken, `Novo token JWT da filial emitido com sucesso`);
  const branchToken = switchRes.data.accessToken;

  // ---------------------------------------------------------------------------
  // TESTE 5: Fluxo de Clientes e Ordem de Serviço com Rastreio Público
  // ---------------------------------------------------------------------------
  console.log("\n▶ [TESTE 5/7] Abertura de O.S. e Consulta Pública por QR Code / Token...");
  // Cadastrar Cliente:
  const createClientRes = await request(`${API_BASE}/clients`, {
    method: "POST",
    headers: { Authorization: `Bearer ${entToken}` },
    body: JSON.stringify({
      name: "Maria Silva Teste",
      phone: "(11) 91111-2222",
      document: "123.456.789-00",
      email: "maria.silva@email.com",
    }),
  });
  assert(createClientRes.status === 201, `Cliente cadastrado com sucesso`);
  const clientId = createClientRes.data.id;

  // Criar Ordem de Serviço:
  const createOsRes = await request(`${API_BASE}/service-orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${entToken}` },
    body: JSON.stringify({
      clientId: clientId,
      deviceType: "Smartphone",
      deviceBrand: "Apple",
      deviceModel: "iPhone 14 Pro",
      serialOrImei: "358901234567890",
      reportedDefect: "Vidro traseiro quebrado e bateria estufada",
      priority: "NORMAL",
      items: [
        {
          itemType: "SERVICE",
          description: "Troca de Tampa Traseira a Laser",
          quantity: 1,
          unitCost: 80.0,
          unitPrice: 280.0,
        },
      ],
    }),
  });
  assert(createOsRes.status === 201, `Ordem de Serviço criada com sucesso`);
  const osData = createOsRes.data;
  assert(!!osData.osNumber, `O.S. recebeu número sequencial: #${osData.osNumber}`);
  assert(!!osData.publicToken, `O.S. recebeu token público de rastreio: ${osData.publicToken}`);

  // Consulta Pública por Token (Sem autenticação / Anônimo como o cliente final faria):
  const publicOsRes = await request(`${API_BASE}/public/os/${osData.publicToken}`);
  assert(publicOsRes.status === 200, `Página pública de acompanhamento respondeu com 200 sem login`);
  assert(publicOsRes.data.osNumber === osData.osNumber, `Dados públicos batem com a O.S. criada`);
  assert(publicOsRes.data.deviceModel === "iPhone 14 Pro", `Modelo do aparelho acessível publicamente`);

  // ---------------------------------------------------------------------------
  // TESTE 6: Catálogo de Estoque e Venda no PDV (Frente de Caixa)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [TESTE 6/7] Catálogo de Estoque e Baixa em Venda de Balcão (PDV)...");
  // Criar produto no estoque com 15 unidades:
  const createProductRes = await request(`${API_BASE}/stock/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${entToken}` },
    body: JSON.stringify({
      name: "Cabo Lightning Original 1m",
      category: "Acessórios",
      sku: `CABO-${timestamp.toString().slice(-4)}`,
      costPrice: 25.0,
      salePrice: 65.0,
      currentStock: 15,
      minStock: 3,
    }),
  });
  assert(createProductRes.status === 201, `Produto criado no estoque com saldo 15`);
  const productId = createProductRes.data.id;

  // Registrar venda no PDV de 3 unidades:
  const saleRes = await request(`${API_BASE}/sales`, {
    method: "POST",
    headers: { Authorization: `Bearer ${entToken}` },
    body: JSON.stringify({
      paymentMethod: "PIX",
      clientId: clientId,
      items: [
        {
          productId: productId,
          quantity: 3,
          unitPrice: 65.0,
        },
      ],
    }),
  });
  assert(saleRes.status === 201, `Venda de 3 unidades registrada com sucesso no PDV`);

  // Verificar baixa no estoque:
  const listProductsRes = await request(`${API_BASE}/stock/products`, {
    headers: { Authorization: `Bearer ${entToken}` },
  });
  const updatedProd = listProductsRes.data.find((p) => p.id === productId);
  assert(
    updatedProd && Number(updatedProd.currentStock) === 12,
    `Estoque atualizado corretamente para 12 unidades (15 - 3) (Valor atual: ${updatedProd?.currentStock})`
  );

  // ---------------------------------------------------------------------------
  // TESTE 7: Verificação dos Pacotes de Produção Compilados
  // ---------------------------------------------------------------------------
  console.log("\n▶ [TESTE 7/7] Verificação dos Artefatos de Produção (Dist & .next)...");
  const fs = require("fs");
  const path = require("path");

  const apiDistExists = fs.existsSync(path.resolve(__dirname, "../apps/api/dist/src/main.js"));
  assert(apiDistExists, "Bundle de produção da API compilado em apps/api/dist/src/main.js");

  const webBuildExists = fs.existsSync(path.resolve(__dirname, "../apps/web/.next/BUILD_ID"));
  assert(webBuildExists, "Bundle otimizado de produção do Next.js presente em apps/web/.next");

  console.log("\n================================================================================");
  console.log("🎉 TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO ABSOLUTO (100% PASS)!");
  console.log("O sistema TorxOS está validado e pronto para o deploy na VPS.");
  console.log("================================================================================\n");
}

run().catch((err) => {
  console.error("\n❌ ERRO DURANTE A EXECUÇÃO DOS TESTES:", err);
  process.exit(1);
});
