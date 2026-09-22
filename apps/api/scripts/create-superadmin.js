#!/usr/bin/env node
/**
 * TorxOS — Utilitário de Criação e Promoção de Dono do Software (Super Admin Global)
 * 
 * Cria ou promove um usuário para o perfil SUPER_ADMIN com tenantId = null
 * (Totalmente independente de perfil de empresa/assistência técnica).
 * 
 * Uso:
 *   node scripts/create-superadmin.js <email> <senha> [nome]
 */

const path = require("path");
const fs = require("fs");

const possibleEnvPaths = [
  path.resolve(process.cwd(), ".env.production"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env.production"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../.env.production"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env.production"),
  path.resolve(__dirname, "../../.env"),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    try {
      require("dotenv").config({ path: envPath });
      break;
    } catch (_) {}
  }
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || "").trim().toLowerCase();
  const password = args[1];
  const name = args[2] || "Dono do Software (Master)";

  if (!email || !password) {
    console.log("\n=================================================================");
    console.log("   👑 TorxOS — Criador de Dono do Software (Super Admin Global)");
    console.log("=================================================================");
    console.log("\n⚠️  Uso obrigatório dos parâmetros:");
    console.log("   node scripts/create-superadmin.js <email> <senha> [nome_opcional]");
    console.log("\n📌 Exemplo prático:");
    console.log('   node scripts/create-superadmin.js dono@torxos.tech "SenhaForte123" "Raphael Dono"');
    console.log("\n🐳 Ou se estiver rodando via Docker na VPS:");
    console.log('   docker compose -f docker-compose.prod.yml exec evorix_api node scripts/create-superadmin.js dono@torxos.tech "SenhaForte123" "Raphael Dono"');
    console.log("=================================================================\n");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ A senha deve conter no mínimo 6 caracteres.");
    process.exit(1);
  }

  console.log(`\n⏳ Processando perfil de Dono do Software para: ${email}...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findFirst({
    where: { email },
    include: { tenant: true },
  });

  let user;
  if (existingUser) {
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: name !== "Dono do Software (Master)" ? name : existingUser.name,
        role: "SUPER_ADMIN",
        tenantId: null, // Desvincula de qualquer empresa! Independente!
        passwordHash,
        isActive: true,
      },
    });
    console.log(`✅ Usuário existente encontrado e promovido com sucesso para SUPER_ADMIN!`);
  } else {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        tenantId: null, // Totalmente independente de qualquer loja/empresa
        isActive: true,
      },
    });
    console.log(`✅ Novo Dono do Software (Super Admin Global) criado com sucesso!`);
  }

  console.log("\n=================================================================");
  console.log("  🎉 PERFIL DE DONO DO SOFTWARE CONFIGURADO COM SUCESSO!");
  console.log("=================================================================");
  console.log(`  • Nome:             ${user.name}`);
  console.log(`  • E-mail de Login:  ${user.email}`);
  console.log(`  • Perfil / Role:    SUPER_ADMIN (Dono Global do Software)`);
  console.log(`  • Empresa:          Nenhuma (100% Independente / Gestão Master)`);
  console.log(`  • Status:           Ativo`);
  console.log("-----------------------------------------------------------------");
  console.log("  🔗 Você já pode acessar diretamente:");
  console.log("  - Login:         https://torxos.tech/login");
  console.log("  - Painel Master: https://torxos.tech/super-admin");
  console.log("=================================================================\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Erro ao configurar Dono do Software:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
