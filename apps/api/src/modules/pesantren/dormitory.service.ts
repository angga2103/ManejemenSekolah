import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateDormitoryDto,
  CreateDormRoomDto,
  AllocateStudentBedDto,
  DormitoryResponseData,
  DormRoomResponseData,
  DormAllocationResponseData,
} from '@edusaas/api-contracts';
import { Gender } from '@edusaas/shared-types';

@Injectable()
export class DormitoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createDormitory(tenantId: string, dto: CreateDormitoryDto): Promise<DormitoryResponseData> {
    const dorm = await this.prisma.dormitory.create({
      data: {
        tenantId,
        name: dto.name,
        gender: dto.gender as Gender,
        buildingCode: dto.buildingCode,
        description: dto.description,
      },
      include: {
        rooms: {
          include: {
            allocations: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return this.mapDormitoryResponse(dorm);
  }

  async listDormitories(tenantId: string): Promise<DormitoryResponseData[]> {
    const dorms = await this.prisma.dormitory.findMany({
      where: { tenantId },
      include: {
        rooms: {
          include: {
            allocations: {
              where: { isActive: true },
              include: {
                student: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return dorms.map((d) => this.mapDormitoryResponse(d));
  }

  async createRoom(tenantId: string, dto: CreateDormRoomDto): Promise<DormRoomResponseData> {
    const dorm = await this.prisma.dormitory.findFirst({
      where: { id: dto.dormitoryId, tenantId },
    });
    if (!dorm) {
      throw new NotFoundException('Gedung asrama tidak ditemukan');
    }

    const room = await this.prisma.dormRoom.create({
      data: {
        dormitoryId: dto.dormitoryId,
        roomNumber: dto.roomNumber,
        floor: dto.floor ?? 1,
        capacity: dto.capacity ?? 10,
        description: dto.description,
      },
      include: {
        allocations: {
          where: { isActive: true },
        },
      },
    });

    return this.mapRoomResponse(room);
  }

  async listRooms(tenantId: string, dormitoryId?: string): Promise<DormRoomResponseData[]> {
    const rooms = await this.prisma.dormRoom.findMany({
      where: {
        dormitory: { tenantId },
        ...(dormitoryId ? { dormitoryId } : {}),
      },
      include: {
        dormitory: true,
        allocations: {
          where: { isActive: true },
          include: {
            student: true,
          },
        },
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });

    return rooms.map((r) => this.mapRoomResponse(r, r.dormitory?.name));
  }

  async allocateBed(tenantId: string, dto: AllocateStudentBedDto): Promise<DormAllocationResponseData> {
    const room = await this.prisma.dormRoom.findFirst({
      where: {
        id: dto.roomId,
        dormitory: { tenantId },
      },
      include: {
        dormitory: true,
        allocations: {
          where: { isActive: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Kamar asrama tidak ditemukan');
    }

    // Capacity check
    if (room.allocations.length >= room.capacity) {
      throw new BadRequestException(
        `Kapasitas kamar ${room.roomNumber} telah penuh (${room.allocations.length}/${room.capacity} santri)`
      );
    }

    // Student verification
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan');
    }

    // Gender check: student gender must match dormitory gender
    if (student.gender !== room.dormitory.gender) {
      throw new BadRequestException(
        `Jenis kelamin santri (${student.gender}) tidak sesuai dengan ketentuan gedung asrama (${room.dormitory.gender})`
      );
    }

    // Deactivate previous active allocation if exists
    await this.prisma.dormAllocation.updateMany({
      where: {
        tenantId,
        studentId: dto.studentId,
        isActive: true,
      },
      data: {
        isActive: false,
        endDate: new Date(),
        notes: 'Pindah kamar / dialokasikan ulang',
      },
    });

    const allocation = await this.prisma.dormAllocation.create({
      data: {
        tenantId,
        roomId: dto.roomId,
        studentId: dto.studentId,
        bedNumber: dto.bedNumber,
        startDate: new Date(dto.startDate),
        isActive: true,
        notes: dto.notes,
      },
      include: {
        student: true,
        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    return {
      id: allocation.id,
      tenantId: allocation.tenantId,
      roomId: allocation.roomId,
      roomNumber: allocation.room.roomNumber,
      dormitoryId: allocation.room.dormitoryId,
      dormitoryName: allocation.room.dormitory.name,
      studentId: allocation.studentId,
      studentName: allocation.student.fullName,
      studentNis: allocation.student.nis,
      bedNumber: allocation.bedNumber,
      startDate: allocation.startDate.toISOString(),
      endDate: allocation.endDate ? allocation.endDate.toISOString() : null,
      isActive: allocation.isActive,
      notes: allocation.notes,
    };
  }

  async deallocateBed(tenantId: string, allocationId: string): Promise<{ success: boolean; message: string }> {
    const allocation = await this.prisma.dormAllocation.findFirst({
      where: { id: allocationId, tenantId },
    });
    if (!allocation) {
      throw new NotFoundException('Data alokasi kamar tidak ditemukan');
    }

    await this.prisma.dormAllocation.update({
      where: { id: allocationId },
      data: {
        isActive: false,
        endDate: new Date(),
        notes: 'Santri telah keluar / check-out dari kamar',
      },
    });

    return {
      success: true,
      message: 'Santri berhasil di-checkout dari kamar asrama',
    };
  }

  async getDormitoryStats(tenantId: string): Promise<{
    totalDormitories: number;
    totalRooms: number;
    totalCapacity: number;
    totalOccupied: number;
    occupancyPercentage: number;
    maleOccupancy: { capacity: number; occupied: number };
    femaleOccupancy: { capacity: number; occupied: number };
  }> {
    const dorms = await this.prisma.dormitory.findMany({
      where: { tenantId },
      include: {
        rooms: {
          include: {
            allocations: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    let totalCapacity = 0;
    let totalOccupied = 0;
    let totalRooms = 0;

    let maleCap = 0;
    let maleOcc = 0;
    let femaleCap = 0;
    let femaleOcc = 0;

    for (const d of dorms) {
      for (const r of d.rooms) {
        totalRooms++;
        totalCapacity += r.capacity;
        totalOccupied += r.allocations.length;

        if (d.gender === Gender.MALE) {
          maleCap += r.capacity;
          maleOcc += r.allocations.length;
        } else {
          femaleCap += r.capacity;
          femaleOcc += r.allocations.length;
        }
      }
    }

    const percentage = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return {
      totalDormitories: dorms.length,
      totalRooms,
      totalCapacity,
      totalOccupied,
      occupancyPercentage: percentage,
      maleOccupancy: { capacity: maleCap, occupied: maleOcc },
      femaleOccupancy: { capacity: femaleCap, occupied: femaleOcc },
    };
  }

  private mapDormitoryResponse(dorm: any): DormitoryResponseData {
    let totalCapacity = 0;
    let totalOccupancy = 0;

    const rooms: DormRoomResponseData[] = (dorm.rooms || []).map((r: any) => {
      const occ = (r.allocations || []).length;
      totalCapacity += r.capacity;
      totalOccupancy += occ;
      return this.mapRoomResponse(r, dorm.name);
    });

    return {
      id: dorm.id,
      tenantId: dorm.tenantId,
      name: dorm.name,
      buildingCode: dorm.buildingCode,
      gender: dorm.gender as Gender,
      description: dorm.description,
      totalRooms: rooms.length,
      totalCapacity,
      totalOccupancy,
      rooms,
    };
  }

  private mapRoomResponse(room: any, dormName?: string): DormRoomResponseData {
    const occ = (room.allocations || []).length;
    const allocations: DormAllocationResponseData[] = (room.allocations || []).map((a: any) => ({
      id: a.id,
      tenantId: a.tenantId || room.dormitory?.tenantId,
      roomId: a.roomId,
      roomNumber: room.roomNumber,
      dormitoryId: room.dormitoryId,
      dormitoryName: dormName || room.dormitory?.name || '',
      studentId: a.studentId,
      studentName: a.student?.fullName || '',
      studentNis: a.student?.nis || '',
      bedNumber: a.bedNumber,
      startDate: a.startDate ? new Date(a.startDate).toISOString() : '',
      endDate: a.endDate ? new Date(a.endDate).toISOString() : null,
      isActive: a.isActive,
      notes: a.notes,
    }));

    return {
      id: room.id,
      dormitoryId: room.dormitoryId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      currentOccupancy: occ,
      availableSlots: Math.max(0, room.capacity - occ),
      description: room.description,
      allocations,
    };
  }
}
