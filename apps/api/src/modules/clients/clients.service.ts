import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, search?: string) {
    if (!tenantId || tenantId.trim() === "") {
      return [];
    }
    const where: any = { tenantId };
    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { document: { contains: q } },
        { email: { contains: q } },
      ];
    }
    return this.prisma.client.findMany({
      where,
      include: {
        _count: {
          select: {
            serviceOrders: true,
            sales: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async create(tenantId: string, data: any) {
    if (!tenantId || tenantId.trim() === "") {
      throw new BadRequestException("Identificador da empresa (tenantId) é obrigatório.");
    }
    if (!data.name || data.name.trim() === "") {
      throw new BadRequestException("Nome do cliente é obrigatório.");
    }
    if (!data.phone || data.phone.trim() === "") {
      throw new BadRequestException("Telefone/WhatsApp do cliente é obrigatório.");
    }

    return this.prisma.client.create({
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        document: data.document?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        tenantId,
      },
    });
  }

  async findById(tenantId: string, id: string) {
    if (!tenantId || tenantId.trim() === "") {
      return null;
    }
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        serviceOrders: { orderBy: { createdAt: "desc" }, take: 10 },
        sales: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!client) {
      throw new NotFoundException("Cliente não encontrado.");
    }

    return client;
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findById(tenantId, id);

    return this.prisma.client.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        document: data.document !== undefined ? (data.document?.trim() || null) : undefined,
        email: data.email !== undefined ? (data.email?.trim() || null) : undefined,
        address: data.address !== undefined ? (data.address?.trim() || null) : undefined,
        notes: data.notes !== undefined ? (data.notes?.trim() || null) : undefined,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            serviceOrders: true,
            sales: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException("Cliente não encontrado.");
    }

    if (client._count.serviceOrders > 0 || client._count.sales > 0) {
      throw new BadRequestException(
        `Não é possível excluir o cliente ${client.name} pois ele possui ${client._count.serviceOrders} OS e ${client._count.sales} venda(s) vinculada(s).`,
      );
    }

    await this.prisma.client.delete({
      where: { id },
    });

    return { success: true, message: "Cliente excluído com sucesso." };
  }
}
