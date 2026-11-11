class CourseMaterialModel {
  final String id;
  final String tenantId;
  final String subjectId;
  final String? subjectName;
  final String? subjectCode;
  final String? classGroupId;
  final String? classGroupName;
  final String? authorName;
  final String title;
  final String? description;
  final String materialType;
  final String? fileUrl;
  final String? content;
  final String createdAt;

  CourseMaterialModel({
    required this.id,
    required this.tenantId,
    required this.subjectId,
    this.subjectName,
    this.subjectCode,
    this.classGroupId,
    this.classGroupName,
    this.authorName,
    required this.title,
    this.description,
    required this.materialType,
    this.fileUrl,
    this.content,
    required this.createdAt,
  });

  factory CourseMaterialModel.fromJson(Map<String, dynamic> json) {
    return CourseMaterialModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      subjectId: json['subjectId'] as String,
      subjectName: json['subjectName'] as String?,
      subjectCode: json['subjectCode'] as String?,
      classGroupId: json['classGroupId'] as String?,
      classGroupName: json['classGroupName'] as String?,
      authorName: json['authorName'] as String?,
      title: json['title'] as String,
      description: json['description'] as String?,
      materialType: json['materialType'] as String? ?? 'DOCUMENT',
      fileUrl: json['fileUrl'] as String?,
      content: json['content'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class AssignmentModel {
  final String id;
  final String tenantId;
  final String subjectId;
  final String? subjectName;
  final String classGroupId;
  final String? classGroupName;
  final String? teacherName;
  final String title;
  final String instructions;
  final String? attachmentUrl;
  final String dueDate;
  final double maxScore;
  final int totalSubmissions;
  final int gradedSubmissions;

  AssignmentModel({
    required this.id,
    required this.tenantId,
    required this.subjectId,
    this.subjectName,
    required this.classGroupId,
    this.classGroupName,
    this.teacherName,
    required this.title,
    required this.instructions,
    this.attachmentUrl,
    required this.dueDate,
    required this.maxScore,
    this.totalSubmissions = 0,
    this.gradedSubmissions = 0,
  });

  factory AssignmentModel.fromJson(Map<String, dynamic> json) {
    return AssignmentModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      subjectId: json['subjectId'] as String,
      subjectName: json['subjectName'] as String?,
      classGroupId: json['classGroupId'] as String,
      classGroupName: json['classGroupName'] as String?,
      teacherName: json['teacherName'] as String?,
      title: json['title'] as String,
      instructions: json['instructions'] as String,
      attachmentUrl: json['attachmentUrl'] as String?,
      dueDate: json['dueDate'] as String,
      maxScore: (json['maxScore'] as num).toDouble(),
      totalSubmissions: (json['totalSubmissions'] as num?)?.toInt() ?? 0,
      gradedSubmissions: (json['gradedSubmissions'] as num?)?.toInt() ?? 0,
    );
  }
}

class AssignmentSubmissionModel {
  final String id;
  final String tenantId;
  final String assignmentId;
  final String? assignmentTitle;
  final String studentId;
  final String? studentName;
  final String submittedAt;
  final String? fileUrl;
  final String? content;
  final double? score;
  final String? feedback;
  final String status;

  AssignmentSubmissionModel({
    required this.id,
    required this.tenantId,
    required this.assignmentId,
    this.assignmentTitle,
    required this.studentId,
    this.studentName,
    required this.submittedAt,
    this.fileUrl,
    this.content,
    this.score,
    this.feedback,
    required this.status,
  });

  factory AssignmentSubmissionModel.fromJson(Map<String, dynamic> json) {
    return AssignmentSubmissionModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      assignmentId: json['assignmentId'] as String,
      assignmentTitle: json['assignmentTitle'] as String?,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String?,
      submittedAt: json['submittedAt'] as String,
      fileUrl: json['fileUrl'] as String?,
      content: json['content'] as String?,
      score: (json['score'] as num?)?.toDouble(),
      feedback: json['feedback'] as String?,
      status: json['status'] as String? ?? 'SUBMITTED',
    );
  }
}
