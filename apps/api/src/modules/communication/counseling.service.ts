import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateCounselingSessionDto,
  CounselingResponseData,
} from '@edusaas/api-contracts';

@Injectable()
export class CounselingService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    tenantId: string,
    dto: CreateCounselingSessionDto
  ): Promise<CounselingResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan');
    }

    const counselor = await this.prisma.employee.findFirst({
      where: { id: dto.counselorEmployeeId, tenantId },
    });
    if (!counselor) {
      throw new NotFoundException('Data guru pembimbing / konselor tidak ditemukan');
    }

    const session = await this.prisma.counselingRecord.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        counselorEmployeeId: dto.counselorEmployeeId,
        sessionDate: new Date(dto.sessionDate),
        category: dto.category,
        notes: dto.notes,
        actionPlan: dto.actionPlan,
        followUpRequired: dto.followUpRequired ?? false,
      },
      include: {
        student: true,
        counselor: true,
      },
    });

    return this.mapCounselingResponse(session);
  }

  async listSessions(
    tenantId: string,
    filters: {
      studentId?: string;
      counselorId?: string;
      followUpOnly?: boolean;
    }
  ): Promise<CounselingResponseData[]> {
    const sessions = await this.prisma.counselingRecord.findMany({
      where: {
        tenantId,
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.counselorId ? { counselorEmployeeId: filters.counselorId } : {}),
        ...(filters.followUpOnly ? { followUpRequired: true } : {}),
      },
      include: {
        student: true,
        counselor: true,
      },
      orderBy: { sessionDate: 'desc' },
      take: 100,
    });

    return sessions.map((s) => this.mapCounselingResponse(s));
  }

  async getSessionById(tenantId: string, id: string): Promise<CounselingResponseData> {
    const session = await this.prisma.counselingRecord.findFirst({
      where: { id, tenantId },
      include: {
        student: true,
        counselor: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Catatan bimbingan konseling tidak ditemukan');
    }

    return this.mapCounselingResponse(session);
  }

  private mapCounselingResponse(s: any): CounselingResponseData {
    return {
      id: s.id,
      tenantId: s.tenantId,
      studentId: s.studentId,
      studentName: s.student?.fullName || '',
      studentNis: s.student?.nis || '',
      counselorEmployeeId: s.counselorEmployeeId,
      counselorName: s.counselor?.fullName || '',
      sessionDate: s.sessionDate.toISOString(),
      category: s.category,
      notes: s.notes,
      actionPlan: s.actionPlan,
      followUpRequired: s.followUpRequired,
      createdAt: s.createdAt.toISOString(),
    };
  }
}
