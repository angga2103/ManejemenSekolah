import { Test, TestingModule } from '@nestjs/testing';
import { DormitoryService } from './dormitory.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Gender } from '@edusaas/shared-types';

describe('DormitoryService', () => {
  let service: DormitoryService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    prisma = {
      dormitory: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      dormRoom: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      dormAllocation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      student: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DormitoryService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<DormitoryService>(DormitoryService);
  });

  it('should create dormitory successfully', async () => {
    prisma.dormitory.create.mockResolvedValue({
      id: 'dorm-1',
      tenantId: mockTenantId,
      name: 'Gedung Al-Fatih (Putra)',
      buildingCode: 'BL-A',
      gender: Gender.MALE,
      description: 'Asrama santri putra',
      rooms: [],
    });

    const result = await service.createDormitory(mockTenantId, {
      name: 'Gedung Al-Fatih (Putra)',
      buildingCode: 'BL-A',
      gender: Gender.MALE,
      description: 'Asrama santri putra',
    });

    expect(result.id).toBe('dorm-1');
    expect(result.name).toBe('Gedung Al-Fatih (Putra)');
    expect(result.totalRooms).toBe(0);
    expect(result.totalCapacity).toBe(0);
  });

  it('should create dorm room under a dormitory', async () => {
    prisma.dormitory.findFirst.mockResolvedValue({
      id: 'dorm-1',
      tenantId: mockTenantId,
      name: 'Gedung Al-Fatih',
    });

    prisma.dormRoom.create.mockResolvedValue({
      id: 'room-101',
      dormitoryId: 'dorm-1',
      roomNumber: '101',
      floor: 1,
      capacity: 8,
      description: 'Kamar depan',
      allocations: [],
    });

    const result = await service.createRoom(mockTenantId, {
      dormitoryId: 'dorm-1',
      roomNumber: '101',
      floor: 1,
      capacity: 8,
    });

    expect(result.id).toBe('room-101');
    expect(result.roomNumber).toBe('101');
    expect(result.capacity).toBe(8);
    expect(result.currentOccupancy).toBe(0);
    expect(result.availableSlots).toBe(8);
  });

  it('should throw BadRequestException when room is at full capacity', async () => {
    prisma.dormRoom.findFirst.mockResolvedValue({
      id: 'room-101',
      roomNumber: '101',
      capacity: 2,
      dormitory: { id: 'dorm-1', gender: Gender.MALE },
      allocations: [{ id: 'a1' }, { id: 'a2' }], // 2 active
    });

    await expect(
      service.allocateBed(mockTenantId, {
        roomId: 'room-101',
        studentId: 'student-1',
        startDate: '2026-08-01',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if student gender mismatches dormitory gender', async () => {
    prisma.dormRoom.findFirst.mockResolvedValue({
      id: 'room-101',
      roomNumber: '101',
      capacity: 4,
      dormitory: { id: 'dorm-1', gender: Gender.MALE },
      allocations: [],
    });

    prisma.student.findFirst.mockResolvedValue({
      id: 'student-female-1',
      gender: Gender.FEMALE,
      fullName: 'Fatimah Zahra',
      nis: '2026002',
    });

    await expect(
      service.allocateBed(mockTenantId, {
        roomId: 'room-101',
        studentId: 'student-female-1',
        startDate: '2026-08-01',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should allocate bed successfully when capacity and gender are valid', async () => {
    prisma.dormRoom.findFirst.mockResolvedValue({
      id: 'room-101',
      roomNumber: '101',
      capacity: 4,
      dormitory: { id: 'dorm-1', gender: Gender.MALE, name: 'Gedung Putra' },
      allocations: [{ id: 'a1' }],
    });

    prisma.student.findFirst.mockResolvedValue({
      id: 'student-male-1',
      gender: Gender.MALE,
      fullName: 'Ahmad Dahlan',
      nis: '2026001',
    });

    prisma.dormAllocation.updateMany.mockResolvedValue({ count: 0 });
    prisma.dormAllocation.create.mockResolvedValue({
      id: 'alloc-1',
      tenantId: mockTenantId,
      roomId: 'room-101',
      studentId: 'student-male-1',
      bedNumber: 'B1-02',
      startDate: new Date('2026-08-01'),
      endDate: null,
      isActive: true,
      notes: 'Penempatan semester ganjil',
      student: { fullName: 'Ahmad Dahlan', nis: '2026001' },
      room: {
        roomNumber: '101',
        dormitoryId: 'dorm-1',
        dormitory: { name: 'Gedung Putra' },
      },
    });

    const result = await service.allocateBed(mockTenantId, {
      roomId: 'room-101',
      studentId: 'student-male-1',
      bedNumber: 'B1-02',
      startDate: '2026-08-01',
      notes: 'Penempatan semester ganjil',
    });

    expect(result.id).toBe('alloc-1');
    expect(result.studentName).toBe('Ahmad Dahlan');
    expect(result.bedNumber).toBe('B1-02');
    expect(result.isActive).toBe(true);
    expect(prisma.dormAllocation.updateMany).toHaveBeenCalledWith({
      where: { tenantId: mockTenantId, studentId: 'student-male-1', isActive: true },
      data: expect.objectContaining({ isActive: false }),
    });
  });

  it('should deallocate bed successfully on checkout', async () => {
    prisma.dormAllocation.findFirst.mockResolvedValue({
      id: 'alloc-1',
      tenantId: mockTenantId,
      isActive: true,
    });
    prisma.dormAllocation.update.mockResolvedValue({ id: 'alloc-1', isActive: false });

    const result = await service.deallocateBed(mockTenantId, 'alloc-1');
    expect(result.success).toBe(true);
    expect(prisma.dormAllocation.update).toHaveBeenCalledWith({
      where: { id: 'alloc-1' },
      data: expect.objectContaining({ isActive: false }),
    });
  });

  it('should calculate dormitory statistics accurately', async () => {
    prisma.dormitory.findMany.mockResolvedValue([
      {
        id: 'dorm-male',
        gender: Gender.MALE,
        rooms: [
          { capacity: 10, allocations: [{}, {}, {}] }, // 3 occupied
          { capacity: 10, allocations: [{}, {}] },       // 2 occupied
        ],
      },
      {
        id: 'dorm-female',
        gender: Gender.FEMALE,
        rooms: [
          { capacity: 8, allocations: [{}, {}, {}, {}] }, // 4 occupied
        ],
      },
    ]);

    const stats = await service.getDormitoryStats(mockTenantId);

    expect(stats.totalDormitories).toBe(2);
    expect(stats.totalRooms).toBe(3);
    expect(stats.totalCapacity).toBe(28); // 10+10+8
    expect(stats.totalOccupied).toBe(9);   // 3+2+4
    expect(stats.occupancyPercentage).toBe(32); // 9/28 = 32%
    expect(stats.maleOccupancy).toEqual({ capacity: 20, occupied: 5 });
    expect(stats.femaleOccupancy).toEqual({ capacity: 8, occupied: 4 });
  });
});
