import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBillingCategoryDto, BillingCategoryResponseData } from '@edusaas/api-contracts';

@Injectable()
export class BillingCategoriesService {
  private readonly logger = new Logger(BillingCategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateBillingCategoryDto): Promise<BillingCategoryResponseData> {
    const existing = await this.prisma.billingCategory.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: dto.code.trim().toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Kategori tagihan dengan kode '${dto.code}' sudah terdaftar`);
    }

    const created = await this.prisma.billingCategory.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        isRecurring: dto.isRecurring ?? false,
      },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      name: created.name,
      code: created.code,
      isRecurring: created.isRecurring,
    };
  }

  async findAll(tenantId: string): Promise<BillingCategoryResponseData[]> {
    const categories = await this.prisma.billingCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      code: c.code,
      isRecurring: c.isRecurring,
    }));
  }

  async findById(tenantId: string, id: string): Promise<BillingCategoryResponseData> {
    const category = await this.prisma.billingCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Kategori tagihan tidak ditemukan');
    }

    return {
      id: category.id,
      tenantId: category.tenantId,
      name: category.name,
      code: category.code,
      isRecurring: category.isRecurring,
    };
  }
}
