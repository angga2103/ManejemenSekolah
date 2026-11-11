class AttendanceModel {
  final String id;
  final String tenantId;
  final String? studentId;
  final String? studentName;
  final String? studentNis;
  final String? classGroupName;
  final String type;
  final String status;
  final String method;
  final String recordedDate;
  final String? checkInTime;
  final String? checkOutTime;
  final String? notes;

  AttendanceModel({
    required this.id,
    required this.tenantId,
    this.studentId,
    this.studentName,
    this.studentNis,
    this.classGroupName,
    required this.type,
    required this.status,
    required this.method,
    required this.recordedDate,
    this.checkInTime,
    this.checkOutTime,
    this.notes,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    return AttendanceModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      studentId: json['studentId'] as String?,
      studentName: json['studentName'] as String?,
      studentNis: json['studentNis'] as String?,
      classGroupName: json['classGroupName'] as String?,
      type: json['type'] as String,
      status: json['status'] as String,
      method: json['method'] as String,
      recordedDate: json['recordedDate'] as String,
      checkInTime: json['checkInTime'] as String?,
      checkOutTime: json['checkOutTime'] as String?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenantId': tenantId,
      'studentId': studentId,
      'studentName': studentName,
      'studentNis': studentNis,
      'classGroupName': classGroupName,
      'type': type,
      'status': status,
      'method': method,
      'recordedDate': recordedDate,
      'checkInTime': checkInTime,
      'checkOutTime': checkOutTime,
      'notes': notes,
    };
  }
}

class AttendanceSummaryModel {
  final String recordedDate;
  final String type;
  final int totalStudents;
  final int presentCount;
  final int lateCount;
  final int sickCount;
  final int permissionCount;
  final int dispensationCount;
  final int absentCount;
  final double attendanceRatePercentage;

  AttendanceSummaryModel({
    required this.recordedDate,
    required this.type,
    required this.totalStudents,
    required this.presentCount,
    required this.lateCount,
    required this.sickCount,
    required this.permissionCount,
    required this.dispensationCount,
    required this.absentCount,
    required this.attendanceRatePercentage,
  });

  factory AttendanceSummaryModel.fromJson(Map<String, dynamic> json) {
    return AttendanceSummaryModel(
      recordedDate: json['recordedDate'] as String,
      type: json['type'] as String,
      totalStudents: json['totalStudents'] as int,
      presentCount: json['presentCount'] as int,
      lateCount: json['lateCount'] as int,
      sickCount: json['sickCount'] as int,
      permissionCount: json['permissionCount'] as int,
      dispensationCount: json['dispensationCount'] as int,
      absentCount: json['absentCount'] as int,
      attendanceRatePercentage: (json['attendanceRatePercentage'] as num).toDouble(),
    );
  }
}

class OfflineScanItem {
  final String clientRecordId;
  final String studentId;
  final String studentName;
  final String type;
  final String status;
  final String recordedDate;
  final String checkInTime;
  final String? deviceId;

  OfflineScanItem({
    required this.clientRecordId,
    required this.studentId,
    required this.studentName,
    required this.type,
    required this.status,
    required this.recordedDate,
    required this.checkInTime,
    this.deviceId,
  });

  Map<String, dynamic> toSyncJson() {
    return {
      'clientRecordId': clientRecordId,
      'studentId': studentId,
      'type': type,
      'status': status,
      'method': 'OFFLINE_SYNC',
      'recordedDate': recordedDate,
      'checkInTime': checkInTime,
      'deviceId': deviceId,
    };
  }
}
