import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateComplaintDto,
  ResolveComplaintDto,
  ComplaintResponseData,
  CreateAnnouncementDto,
  AnnouncementResponseData,
} from '@edusaas/api-contracts';
import { ComplaintStatus, ComplaintPriority } from '@edusaas/shared-types';

@Injectable()
export class ComplaintService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // COMPLAINTS
  // ===========================================================================

  async createComplaint(
    tenantId: string,
    userId: string,
    dto: CreateComplaintDto
  ): Promise<ComplaintResponseData> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Data pelapor / pengguna tidak ditemukan');
    }

    const complaint = await this.prisma.complaintTicket.create({
      data: {
        tenantId,
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority || ComplaintPriority.MEDIUM,
        status: ComplaintStatus.OPEN,
      },
      include: {
        user: true,
      },
    });

    return this.mapComplaintResponse(complaint);
  }

  async resolveComplaint(
    tenantId: string,
    id: string,
    dto: ResolveComplaintDto
  ): Promise<ComplaintResponseData> {
    const complaint = await this.prisma.complaintTicket.findFirst({
      where: { id, tenantId },
    });

    if (!complaint) {
      throw new NotFoundException('Tiket pengaduan tidak ditemukan');
    }

    const isResolved =
      dto.status === ComplaintStatus.RESOLVED || dto.status === ComplaintStatus.CLOSED;

    const updated = await this.prisma.complaintTicket.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes,
        resolvedAt: isResolved ? new Date() : null,
      },
      include: {
        user: true,
      },
    });

    return this.mapComplaintResponse(updated);
  }

  async listComplaints(
    tenantId: string,
    filters: {
      userId?: string;
      status?: ComplaintStatus;
      priority?: ComplaintPriority;
      category?: string;
    }
  ): Promise<ComplaintResponseData[]> {
    const complaints = await this.prisma.complaintTicket.findMany({
      where: {
        tenantId,
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return complaints.map((c) => this.mapComplaintResponse(c));
  }

  // ===========================================================================
  // ANNOUNCEMENTS
  // ===========================================================================

  async createAnnouncement(
    tenantId: string,
    dto: CreateAnnouncementDto
  ): Promise<AnnouncementResponseData> {
    const announcement = await this.prisma.announcement.create({
      data: {
        tenantId,
        title: dto.title,
        content: dto.content,
        targetAudience: dto.targetAudience || 'ALL',
        isPublished: true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: announcement.id,
      tenantId: announcement.tenantId,
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      isPublished: announcement.isPublished,
      publishedAt: announcement.publishedAt.toISOString(),
      expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString() : null,
    };
  }

  async listAnnouncements(
    tenantId: string,
    targetAudience?: string
  ): Promise<AnnouncementResponseData[]> {
    const announcements = await this.prisma.announcement.findMany({
      where: {
        tenantId,
        isPublished: true,
        ...(targetAudience ? { targetAudience: { in: ['ALL', targetAudience] } } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    return announcements.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      title: a.title,
      content: a.content,
      targetAudience: a.targetAudience,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt.toISOString(),
      expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    }));
  }

  private mapComplaintResponse(c: any): ComplaintResponseData {
    return {
      id: c.id,
      tenantId: c.tenantId,
      userId: c.userId,
      userName: c.user?.fullName || 'Pengguna',
      userEmail: c.user?.email || null,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority as ComplaintPriority,
      status: c.status as ComplaintStatus,
      resolutionNotes: c.resolutionNotes,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    };
  }
}
