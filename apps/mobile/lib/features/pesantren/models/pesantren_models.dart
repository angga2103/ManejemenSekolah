class DormRoomModel {
  final String id;
  final String dormitoryId;
  final String roomNumber;
  final int floor;
  final int capacity;
  final int currentOccupancy;
  final int availableSlots;
  final String? description;

  DormRoomModel({
    required this.id,
    required this.dormitoryId,
    required this.roomNumber,
    required this.floor,
    required this.capacity,
    required this.currentOccupancy,
    required this.availableSlots,
    this.description,
  });

  factory DormRoomModel.fromJson(Map<String, dynamic> json) {
    return DormRoomModel(
      id: json['id'] as String,
      dormitoryId: json['dormitoryId'] as String,
      roomNumber: json['roomNumber'] as String,
      floor: json['floor'] as int? ?? 1,
      capacity: json['capacity'] as int? ?? 10,
      currentOccupancy: json['currentOccupancy'] as int? ?? 0,
      availableSlots: json['availableSlots'] as int? ?? 0,
      description: json['description'] as String?,
    );
  }
}

class DormitoryModel {
  final String id;
  final String tenantId;
  final String name;
  final String? buildingCode;
  final String gender;
  final String? description;
  final int totalRooms;
  final int totalCapacity;
  final int totalOccupancy;
  final List<DormRoomModel> rooms;

  DormitoryModel({
    required this.id,
    required this.tenantId,
    required this.name,
    this.buildingCode,
    required this.gender,
    this.description,
    required this.totalRooms,
    required this.totalCapacity,
    required this.totalOccupancy,
    required this.rooms,
  });

  factory DormitoryModel.fromJson(Map<String, dynamic> json) {
    return DormitoryModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      name: json['name'] as String,
      buildingCode: json['buildingCode'] as String?,
      gender: json['gender'] as String,
      description: json['description'] as String?,
      totalRooms: json['totalRooms'] as int? ?? 0,
      totalCapacity: json['totalCapacity'] as int? ?? 0,
      totalOccupancy: json['totalOccupancy'] as int? ?? 0,
      rooms: (json['rooms'] as List<dynamic>?)
              ?.map((r) => DormRoomModel.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class HalaqahGroupModel {
  final String id;
  final String name;
  final String ustazName;
  final int targetJuz;
  final String? schedule;
  final int memberCount;

  HalaqahGroupModel({
    required this.id,
    required this.name,
    required this.ustazName,
    required this.targetJuz,
    this.schedule,
    required this.memberCount,
  });

  factory HalaqahGroupModel.fromJson(Map<String, dynamic> json) {
    return HalaqahGroupModel(
      id: json['id'] as String,
      name: json['name'] as String,
      ustazName: json['ustazName'] as String,
      targetJuz: json['targetJuz'] as int? ?? 30,
      schedule: json['schedule'] as String?,
      memberCount: json['memberCount'] as int? ?? 0,
    );
  }
}

class TahfizRecordModel {
  final String id;
  final String studentId;
  final String studentName;
  final String studentNis;
  final String musyrifName;
  final String? halaqahGroupName;
  final String recordType; // ZIYADAH or MUROJA_AH
  final int surahNumber;
  final String surahName;
  final int ayatStart;
  final int ayatEnd;
  final int juz;
  final String fluencyRating; // MUMTAZ, JAYYID_JIDDAN, JAYYID, MAQBUL
  final String? tajwidRating;
  final String? notes;
  final DateTime recordedAt;

  TahfizRecordModel({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.studentNis,
    required this.musyrifName,
    this.halaqahGroupName,
    required this.recordType,
    required this.surahNumber,
    required this.surahName,
    required this.ayatStart,
    required this.ayatEnd,
    required this.juz,
    required this.fluencyRating,
    this.tajwidRating,
    this.notes,
    required this.recordedAt,
  });

  factory TahfizRecordModel.fromJson(Map<String, dynamic> json) {
    return TahfizRecordModel(
      id: json['id'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      musyrifName: json['musyrifName'] as String,
      halaqahGroupName: json['halaqahGroupName'] as String?,
      recordType: json['recordType'] as String,
      surahNumber: json['surahNumber'] as int,
      surahName: json['surahName'] as String,
      ayatStart: json['ayatStart'] as int,
      ayatEnd: json['ayatEnd'] as int,
      juz: json['juz'] as int,
      fluencyRating: json['fluencyRating'] as String,
      tajwidRating: json['tajwidRating'] as String?,
      notes: json['notes'] as String?,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
    );
  }
}

class TahfizProgressSummaryModel {
  final String studentId;
  final String studentName;
  final String studentNis;
  final int totalJuzCompleted;
  final int totalVersesMemorized;
  final String? latestSurahName;
  final int? latestAyatEnd;
  final int? latestJuz;
  final int ziyadahCount;
  final int murojaahCount;
  final DateTime? lastRecordDate;

  TahfizProgressSummaryModel({
    required this.studentId,
    required this.studentName,
    required this.studentNis,
    required this.totalJuzCompleted,
    required this.totalVersesMemorized,
    this.latestSurahName,
    this.latestAyatEnd,
    this.latestJuz,
    required this.ziyadahCount,
    required this.murojaahCount,
    this.lastRecordDate,
  });

  factory TahfizProgressSummaryModel.fromJson(Map<String, dynamic> json) {
    return TahfizProgressSummaryModel(
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      totalJuzCompleted: json['totalJuzCompleted'] as int? ?? 0,
      totalVersesMemorized: json['totalVersesMemorized'] as int? ?? 0,
      latestSurahName: json['latestSurahName'] as String?,
      latestAyatEnd: json['latestAyatEnd'] as int?,
      latestJuz: json['latestJuz'] as int?,
      ziyadahCount: json['ziyadahCount'] as int? ?? 0,
      murojaahCount: json['murojaahCount'] as int? ?? 0,
      lastRecordDate: json['lastRecordDate'] != null
          ? DateTime.parse(json['lastRecordDate'] as String)
          : null,
    );
  }
}

class PesantrenPermitModel {
  final String id;
  final String studentId;
  final String studentName;
  final String studentNis;
  final String permitType; // PULANG_KE_RUMAH, KELUAR_KOMPLEKS, RUMAH_SAKIT, LAINNYA
  final String reason;
  final String pickupPersonName;
  final String pickupPersonRelation;
  final String pickupPersonPhone;
  final DateTime expectedDeparture;
  final DateTime expectedReturn;
  final DateTime? actualDeparture;
  final DateTime? actualReturn;
  final String securityGateToken;
  final String status; // PENDING_APPROVAL, APPROVED_BY_MUSYRIF, etc.
  final String? approvedByMusyrifName;
  final String? approvedByKeasramaanName;
  final String? notes;
  final DateTime createdAt;

  PesantrenPermitModel({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.studentNis,
    required this.permitType,
    required this.reason,
    required this.pickupPersonName,
    required this.pickupPersonRelation,
    required this.pickupPersonPhone,
    required this.expectedDeparture,
    required this.expectedReturn,
    this.actualDeparture,
    this.actualReturn,
    required this.securityGateToken,
    required this.status,
    this.approvedByMusyrifName,
    this.approvedByKeasramaanName,
    this.notes,
    required this.createdAt,
  });

  factory PesantrenPermitModel.fromJson(Map<String, dynamic> json) {
    return PesantrenPermitModel(
      id: json['id'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      permitType: json['permitType'] as String,
      reason: json['reason'] as String,
      pickupPersonName: json['pickupPersonName'] as String,
      pickupPersonRelation: json['pickupPersonRelation'] as String,
      pickupPersonPhone: json['pickupPersonPhone'] as String,
      expectedDeparture: DateTime.parse(json['expectedDeparture'] as String),
      expectedReturn: DateTime.parse(json['expectedReturn'] as String),
      actualDeparture: json['actualDeparture'] != null
          ? DateTime.parse(json['actualDeparture'] as String)
          : null,
      actualReturn: json['actualReturn'] != null
          ? DateTime.parse(json['actualReturn'] as String)
          : null,
      securityGateToken: json['securityGateToken'] as String,
      status: json['status'] as String,
      approvedByMusyrifName: json['approvedByMusyrifName'] as String?,
      approvedByKeasramaanName: json['approvedByKeasramaanName'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
