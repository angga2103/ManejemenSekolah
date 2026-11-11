class GradeModel {
  final String id;
  final String tenantId;
  final String studentId;
  final String? studentName;
  final String? studentNis;
  final String subjectId;
  final String? subjectName;
  final String? subjectCode;
  final String? curriculumType;
  final String academicYearId;
  final String? academicYearName;
  final String component;
  final double score;
  final double weight;
  final String? notes;
  final String createdAt;

  GradeModel({
    required this.id,
    required this.tenantId,
    required this.studentId,
    this.studentName,
    this.studentNis,
    required this.subjectId,
    this.subjectName,
    this.subjectCode,
    this.curriculumType,
    required this.academicYearId,
    this.academicYearName,
    required this.component,
    required this.score,
    required this.weight,
    this.notes,
    required this.createdAt,
  });

  factory GradeModel.fromJson(Map<String, dynamic> json) {
    return GradeModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String?,
      studentNis: json['studentNis'] as String?,
      subjectId: json['subjectId'] as String,
      subjectName: json['subjectName'] as String?,
      subjectCode: json['subjectCode'] as String?,
      curriculumType: json['curriculumType'] as String?,
      academicYearId: json['academicYearId'] as String,
      academicYearName: json['academicYearName'] as String?,
      component: json['component'] as String,
      score: (json['score'] as num).toDouble(),
      weight: (json['weight'] as num?)?.toDouble() ?? 1.0,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class SubjectScoreSummaryModel {
  final String subjectId;
  final String subjectName;
  final String subjectCode;
  final String curriculumType;
  final double kkm;
  final double? dailyTaskScore;
  final double? quizScore;
  final double? midExamScore;
  final double? finalExamScore;
  final double? practicalScore;
  final double? characterScore;
  final double finalScore;
  final String predicate;
  final bool isPassed;
  final String competencyDescription;

  SubjectScoreSummaryModel({
    required this.subjectId,
    required this.subjectName,
    required this.subjectCode,
    required this.curriculumType,
    required this.kkm,
    this.dailyTaskScore,
    this.quizScore,
    this.midExamScore,
    this.finalExamScore,
    this.practicalScore,
    this.characterScore,
    required this.finalScore,
    required this.predicate,
    required this.isPassed,
    required this.competencyDescription,
  });

  factory SubjectScoreSummaryModel.fromJson(Map<String, dynamic> json) {
    return SubjectScoreSummaryModel(
      subjectId: json['subjectId'] as String,
      subjectName: json['subjectName'] as String,
      subjectCode: json['subjectCode'] as String,
      curriculumType: json['curriculumType'] as String,
      kkm: (json['kkm'] as num?)?.toDouble() ?? 75.0,
      dailyTaskScore: (json['dailyTaskScore'] as num?)?.toDouble(),
      quizScore: (json['quizScore'] as num?)?.toDouble(),
      midExamScore: (json['midExamScore'] as num?)?.toDouble(),
      finalExamScore: (json['finalExamScore'] as num?)?.toDouble(),
      practicalScore: (json['practicalScore'] as num?)?.toDouble(),
      characterScore: (json['characterScore'] as num?)?.toDouble(),
      finalScore: (json['finalScore'] as num).toDouble(),
      predicate: json['predicate'] as String,
      isPassed: json['isPassed'] as bool? ?? true,
      competencyDescription: json['competencyDescription'] as String? ?? '',
    );
  }
}

class ReportCardAttendanceSummaryModel {
  final int presentCount;
  final int lateCount;
  final int sickCount;
  final int permissionCount;
  final int absentCount;

  ReportCardAttendanceSummaryModel({
    required this.presentCount,
    required this.lateCount,
    required this.sickCount,
    required this.permissionCount,
    required this.absentCount,
  });

  factory ReportCardAttendanceSummaryModel.fromJson(Map<String, dynamic> json) {
    return ReportCardAttendanceSummaryModel(
      presentCount: (json['presentCount'] as num?)?.toInt() ?? 0,
      lateCount: (json['lateCount'] as num?)?.toInt() ?? 0,
      sickCount: (json['sickCount'] as num?)?.toInt() ?? 0,
      permissionCount: (json['permissionCount'] as num?)?.toInt() ?? 0,
      absentCount: (json['absentCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class ReportCardModel {
  final String id;
  final String tenantId;
  final String studentId;
  final String studentName;
  final String studentNis;
  final String? studentNisn;
  final String classGroupId;
  final String classGroupName;
  final String academicYearId;
  final String academicYearName;
  final String semester;
  final double finalAverage;
  final String overallPredicate;
  final int? ranking;
  final int totalStudentsInClass;
  final String? remarks;
  final String? pdfUrl;
  final String issuedAt;
  final List<SubjectScoreSummaryModel> subjects;
  final ReportCardAttendanceSummaryModel attendanceSummary;

  ReportCardModel({
    required this.id,
    required this.tenantId,
    required this.studentId,
    required this.studentName,
    required this.studentNis,
    this.studentNisn,
    required this.classGroupId,
    required this.classGroupName,
    required this.academicYearId,
    required this.academicYearName,
    required this.semester,
    required this.finalAverage,
    required this.overallPredicate,
    this.ranking,
    required this.totalStudentsInClass,
    this.remarks,
    this.pdfUrl,
    required this.issuedAt,
    required this.subjects,
    required this.attendanceSummary,
  });

  factory ReportCardModel.fromJson(Map<String, dynamic> json) {
    return ReportCardModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      studentNisn: json['studentNisn'] as String?,
      classGroupId: json['classGroupId'] as String,
      classGroupName: json['classGroupName'] as String,
      academicYearId: json['academicYearId'] as String,
      academicYearName: json['academicYearName'] as String,
      semester: json['semester'] as String,
      finalAverage: (json['finalAverage'] as num).toDouble(),
      overallPredicate: json['overallPredicate'] as String? ?? 'B',
      ranking: (json['ranking'] as num?)?.toInt(),
      totalStudentsInClass: (json['totalStudentsInClass'] as num?)?.toInt() ?? 0,
      remarks: json['remarks'] as String?,
      pdfUrl: json['pdfUrl'] as String?,
      issuedAt: json['issuedAt'] as String? ?? '',
      subjects: (json['subjects'] as List<dynamic>?)
              ?.map((s) => SubjectScoreSummaryModel.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
      attendanceSummary: json['attendanceSummary'] != null
          ? ReportCardAttendanceSummaryModel.fromJson(json['attendanceSummary'] as Map<String, dynamic>)
          : ReportCardAttendanceSummaryModel(
              presentCount: 0,
              lateCount: 0,
              sickCount: 0,
              permissionCount: 0,
              absentCount: 0,
            ),
    );
  }
}
