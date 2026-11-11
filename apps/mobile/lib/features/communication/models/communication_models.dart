class ViolationModel {
  final String id;
  final String studentId;
  final String studentName;
  final String studentNis;
  final String recordedByName;
  final DateTime violationDate;
  final String title;
  final int points;
  final String? sanction;
  final String status;

  ViolationModel({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.studentNis,
    required this.recordedByName,
    required this.violationDate,
    required this.title,
    required this.points,
    this.sanction,
    required this.status,
  });

  factory ViolationModel.fromJson(Map<String, dynamic> json) {
    return ViolationModel(
      id: json['id'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      recordedByName: json['recordedByName'] as String,
      violationDate: DateTime.parse(json['violationDate'] as String),
      title: json['title'] as String,
      points: json['points'] as int? ?? 0,
      sanction: json['sanction'] as String?,
      status: json['status'] as String? ?? 'RECORDED',
    );
  }
}

class StudentDisciplineSummaryModel {
  final String studentId;
  final String studentName;
  final String studentNis;
  final int totalPoints;
  final String sanctionLetter; // NONE, SP1, SP2, SP3_CALL_PARENT
  final int violationCount;
  final DateTime? latestViolationDate;

  StudentDisciplineSummaryModel({
    required this.studentId,
    required this.studentName,
    required this.studentNis,
    required this.totalPoints,
    required this.sanctionLetter,
    required this.violationCount,
    this.latestViolationDate,
  });

  factory StudentDisciplineSummaryModel.fromJson(Map<String, dynamic> json) {
    return StudentDisciplineSummaryModel(
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      totalPoints: json['totalPoints'] as int? ?? 0,
      sanctionLetter: json['sanctionLetter'] as String? ?? 'NONE',
      violationCount: json['violationCount'] as int? ?? 0,
      latestViolationDate: json['latestViolationDate'] != null
          ? DateTime.parse(json['latestViolationDate'] as String)
          : null,
    );
  }
}

class AchievementModel {
  final String id;
  final String studentId;
  final String studentName;
  final String studentNis;
  final String title;
  final String level;
  final DateTime achievementDate;
  final int points;
  final String? certificateUrl;

  AchievementModel({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.studentNis,
    required this.title,
    required this.level,
    required this.achievementDate,
    required this.points,
    this.certificateUrl,
  });

  factory AchievementModel.fromJson(Map<String, dynamic> json) {
    return AchievementModel(
      id: json['id'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      title: json['title'] as String,
      level: json['level'] as String,
      achievementDate: DateTime.parse(json['achievementDate'] as String),
      points: json['points'] as int? ?? 0,
      certificateUrl: json['certificateUrl'] as String?,
    );
  }
}

class CounselingModel {
  final String id;
  final String studentId;
  final String studentName;
  final String studentNis;
  final String counselorName;
  final DateTime sessionDate;
  final String category;
  final String notes;
  final String? actionPlan;
  final bool followUpRequired;

  CounselingModel({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.studentNis,
    required this.counselorName,
    required this.sessionDate,
    required this.category,
    required this.notes,
    this.actionPlan,
    required this.followUpRequired,
  });

  factory CounselingModel.fromJson(Map<String, dynamic> json) {
    return CounselingModel(
      id: json['id'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      counselorName: json['counselorName'] as String,
      sessionDate: DateTime.parse(json['sessionDate'] as String),
      category: json['category'] as String,
      notes: json['notes'] as String,
      actionPlan: json['actionPlan'] as String?,
      followUpRequired: json['followUpRequired'] as bool? ?? false,
    );
  }
}

class ComplaintTicketModel {
  final String id;
  final String userId;
  final String userName;
  final String? userEmail;
  final String title;
  final String description;
  final String category;
  final String priority; // LOW, MEDIUM, HIGH, URGENT
  final String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  final String? resolutionNotes;
  final DateTime createdAt;
  final DateTime? resolvedAt;

  ComplaintTicketModel({
    required this.id,
    required this.userId,
    required this.userName,
    this.userEmail,
    required this.title,
    required this.description,
    required this.category,
    required this.priority,
    required this.status,
    this.resolutionNotes,
    required this.createdAt,
    this.resolvedAt,
  });

  factory ComplaintTicketModel.fromJson(Map<String, dynamic> json) {
    return ComplaintTicketModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userEmail: json['userEmail'] as String?,
      title: json['title'] as String,
      description: json['description'] as String,
      category: json['category'] as String,
      priority: json['priority'] as String? ?? 'MEDIUM',
      status: json['status'] as String? ?? 'OPEN',
      resolutionNotes: json['resolutionNotes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'] as String)
          : null,
    );
  }
}
