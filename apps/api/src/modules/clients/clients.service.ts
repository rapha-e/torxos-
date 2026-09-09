import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { document: { contains: search } },
      ];
    }
    return this.prisma.client.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.client.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        serviceOrders: { orderBy: { createdAt: "desc" } },
      },
    });
  }
}
