import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateHalaqahGroupDto,
  AddHalaqahMemberDto,
  RecordTahfizEntryDto,
  HalaqahGroupResponseData,
  TahfizRecordResponseData,
  TahfizStudentProgressSummaryDto,
} from '@edusaas/api-contracts';
import { TahfizRecordType, TahfizFluencyRating } from '@edusaas/shared-types';

@Injectable()
export class TahfizService {
  constructor(private readonly prisma: PrismaService) {}

  async createHalaqahGroup(tenantId: string, dto: CreateHalaqahGroupDto): Promise<HalaqahGroupResponseData> {
    const ustaz = await this.prisma.employee.findFirst({
      where: { id: dto.ustazEmployeeId, tenantId },
    });
    if (!ustaz) {
      throw new NotFoundException('Data ustadz pembina halaqah tidak ditemukan');
    }

    const group = await this.prisma.halaqahGroup.create({
      data: {
        tenantId,
        name: dto.name,
        ustazEmployeeId: dto.ustazEmployeeId,
        targetJuz: dto.targetJuz ?? 30,
        schedule: dto.schedule,
      },
      include: {
        ustaz: true,
        members: {
          include: {
            student: true,
          },
        },
      },
    });

    return this.mapHalaqahResponse(group);
  }

  async listHalaqahGroups(tenantId: string): Promise<HalaqahGroupResponseData[]> {
    const groups = await this.prisma.halaqahGroup.findMany({
      where: { tenantId },
      include: {
        ustaz: true,
        members: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return groups.map((g) => this.mapHalaqahResponse(g));
  }

  async addHalaqahMember(
    tenantId: string,
    halaqahGroupId: string,
    dto: AddHalaqahMemberDto
  ): Promise<{ success: boolean; message: string }> {
    const group = await this.prisma.halaqahGroup.findFirst({
      where: { id: halaqahGroupId, tenantId },
    });
    if (!group) {
      throw new NotFoundException('Kelompok halaqah tidak ditemukan');
    }

    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan');
    }

    // Check existing membership
    const existing = await this.prisma.halaqahMember.findUnique({
      where: {
        halaqahGroupId_studentId: {
          halaqahGroupId,
          studentId: dto.studentId,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Santri sudah terdaftar di kelompok halaqah ini');
    }

    await this.prisma.halaqahMember.create({
      data: {
        halaqahGroupId,
        studentId: dto.studentId,
      },
    });

    return {
      success: true,
      message: `Santri ${student.fullName} berhasil ditambahkan ke kelompok ${group.name}`,
    };
  }

  async removeHalaqahMember(
    tenantId: string,
    halaqahGroupId: string,
    studentId: string
  ): Promise<{ success: boolean; message: string }> {
    const group = await this.prisma.halaqahGroup.findFirst({
      where: { id: halaqahGroupId, tenantId },
    });
    if (!group) {
      throw new NotFoundException('Kelompok halaqah tidak ditemukan');
    }

    const member = await this.prisma.halaqahMember.findUnique({
      where: {
        halaqahGroupId_studentId: {
          halaqahGroupId,
          studentId,
        },
      },
    });
    if (!member) {
      throw new NotFoundException('Santri tidak terdaftar di kelompok halaqah ini');
    }

    await this.prisma.halaqahMember.delete({
      where: {
        halaqahGroupId_studentId: {
          halaqahGroupId,
          studentId,
        },
      },
    });

    return {
      success: true,
      message: 'Santri berhasil dikeluarkan dari kelompok halaqah',
    };
  }

  async recordTahfizEntry(tenantId: string, dto: RecordTahfizEntryDto): Promise<TahfizRecordResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan');
    }

    const musyrif = await this.prisma.employee.findFirst({
      where: { id: dto.musyrifId, tenantId },
    });
    if (!musyrif) {
      throw new NotFoundException('Data musyrif penilai tidak ditemukan');
    }

    if (dto.surahNumber < 1 || dto.surahNumber > 114) {
      throw new BadRequestException('Nomor surah tidak valid (harus 1-114)');
    }

    if (dto.juz < 1 || dto.juz > 30) {
      throw new BadRequestException('Nomor juz tidak valid (harus 1-30)');
    }

    if (dto.ayatStart > dto.ayatEnd) {
      throw new BadRequestException('Ayat awal tidak boleh lebih besar dari ayat akhir');
    }

    const record = await this.prisma.tahfizRecord.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        musyrifId: dto.musyrifId,
        halaqahGroupId: dto.halaqahGroupId,
        recordType: dto.recordType,
        surahNumber: dto.surahNumber,
        surahName: dto.surahName,
        ayatStart: dto.ayatStart,
        ayatEnd: dto.ayatEnd,
        juz: dto.juz,
        fluencyRating: dto.fluencyRating,
        tajwidRating: dto.tajwidRating ?? 'JAYYID',
        notes: dto.notes,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
      include: {
        student: true,
        musyrif: true,
        halaqahGroup: true,
      },
    });

    return this.mapTahfizRecordResponse(record);
  }

  async listTahfizRecords(
    tenantId: string,
    filters: {
      studentId?: string;
      halaqahGroupId?: string;
      recordType?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<TahfizRecordResponseData[]> {
    const records = await this.prisma.tahfizRecord.findMany({
      where: {
        tenantId,
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.halaqahGroupId ? { halaqahGroupId: filters.halaqahGroupId } : {}),
        ...(filters.recordType ? { recordType: filters.recordType } : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              recordedAt: {
                ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
                ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        student: true,
        musyrif: true,
        halaqahGroup: true,
      },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    return records.map((r) => this.mapTahfizRecordResponse(r));
  }

  async getStudentProgress(tenantId: string, studentId: string): Promise<TahfizStudentProgressSummaryDto> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan');
    }

    const records = await this.prisma.tahfizRecord.findMany({
      where: { tenantId, studentId },
      orderBy: { recordedAt: 'desc' },
    });

    let ziyadahCount = 0;
    let murojaahCount = 0;
    let totalVerses = 0;
    const completedJuzSet = new Set<number>();

    for (const r of records) {
      if (r.recordType === TahfizRecordType.ZIYADAH) {
        ziyadahCount++;
        totalVerses += Math.max(1, r.ayatEnd - r.ayatStart + 1);

        if (
          r.fluencyRating === TahfizFluencyRating.MUMTAZ ||
          r.fluencyRating === TahfizFluencyRating.JAYYID_JIDDAN ||
          r.fluencyRating === TahfizFluencyRating.JAYYID
        ) {
          completedJuzSet.add(r.juz);
        }
      } else {
        murojaahCount++;
      }
    }

    const latest = records[0];

    return {
      studentId: student.id,
      studentName: student.fullName,
      studentNis: student.nis,
      totalJuzCompleted: completedJuzSet.size,
      totalVersesMemorized: totalVerses,
      latestSurahName: latest?.surahName || null,
      latestAyatEnd: latest?.ayatEnd || null,
      latestJuz: latest?.juz || null,
      ziyadahCount,
      murojaahCount,
      lastRecordDate: latest ? latest.recordedAt.toISOString() : null,
    };
  }

  private mapHalaqahResponse(group: any): HalaqahGroupResponseData {
    const members = (group.members || []).map((m: any) => ({
      id: m.id,
      studentId: m.studentId,
      studentName: m.student?.fullName || '',
      studentNis: m.student?.nis || '',
      joinedAt: m.joinedAt.toISOString(),
    }));

    return {
      id: group.id,
      tenantId: group.tenantId,
      name: group.name,
      ustazEmployeeId: group.ustazEmployeeId,
      ustazName: group.ustaz?.fullName || '',
      targetJuz: group.targetJuz,
      schedule: group.schedule,
      memberCount: members.length,
      members,
      createdAt: group.createdAt.toISOString(),
    };
  }

  private mapTahfizRecordResponse(r: any): TahfizRecordResponseData {
    return {
      id: r.id,
      tenantId: r.tenantId,
      studentId: r.studentId,
      studentName: r.student?.fullName || '',
      studentNis: r.student?.nis || '',
      musyrifId: r.musyrifId,
      musyrifName: r.musyrif?.fullName || '',
      halaqahGroupId: r.halaqahGroupId,
      halaqahGroupName: r.halaqahGroup?.name || null,
      recordType: r.recordType as TahfizRecordType,
      surahNumber: r.surahNumber,
      surahName: r.surahName,
      ayatStart: r.ayatStart,
      ayatEnd: r.ayatEnd,
      juz: r.juz,
      fluencyRating: r.fluencyRating as TahfizFluencyRating,
      tajwidRating: r.tajwidRating,
      notes: r.notes,
      recordedAt: r.recordedAt.toISOString(),
    };
  }
}
