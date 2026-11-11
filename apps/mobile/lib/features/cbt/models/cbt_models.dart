class QuestionOptionModel {
  final String id;
  final String text;

  QuestionOptionModel({required this.id, required this.text});

  factory QuestionOptionModel.fromJson(Map<String, dynamic> json) {
    return QuestionOptionModel(
      id: json['id'] as String,
      text: json['text'] as String,
    );
  }
}

class ExamQuestionModel {
  final String id;
  final String bankId;
  final String questionText;
  final String questionType;
  final double scoreWeight;
  final List<QuestionOptionModel> options;
  final String? correctAnswer;
  final String? explanation;
  final int orderIndex;

  ExamQuestionModel({
    required this.id,
    required this.bankId,
    required this.questionText,
    required this.questionType,
    required this.scoreWeight,
    required this.options,
    this.correctAnswer,
    this.explanation,
    required this.orderIndex,
  });

  factory ExamQuestionModel.fromJson(Map<String, dynamic> json) {
    return ExamQuestionModel(
      id: json['id'] as String,
      bankId: json['bankId'] as String,
      questionText: json['questionText'] as String,
      questionType: json['questionType'] as String,
      scoreWeight: (json['scoreWeight'] as num).toDouble(),
      options: (json['options'] as List<dynamic>?)
              ?.map((o) => QuestionOptionModel.fromJson(o as Map<String, dynamic>))
              .toList() ??
          [],
      correctAnswer: json['correctAnswer'] as String?,
      explanation: json['explanation'] as String?,
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
    );
  }
}

class ExamModel {
  final String id;
  final String tenantId;
  final String title;
  final String subjectId;
  final String? subjectName;
  final String classGroupId;
  final String? classGroupName;
  final String token;
  final int durationMinutes;
  final String startTime;
  final String endTime;
  final double passingScore;
  final int totalQuestions;
  final bool isPublished;

  ExamModel({
    required this.id,
    required this.tenantId,
    required this.title,
    required this.subjectId,
    this.subjectName,
    required this.classGroupId,
    this.classGroupName,
    required this.token,
    required this.durationMinutes,
    required this.startTime,
    required this.endTime,
    required this.passingScore,
    required this.totalQuestions,
    required this.isPublished,
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    return ExamModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      title: json['title'] as String,
      subjectId: json['subjectId'] as String,
      subjectName: json['subjectName'] as String?,
      classGroupId: json['classGroupId'] as String,
      classGroupName: json['classGroupName'] as String?,
      token: json['token'] as String,
      durationMinutes: (json['durationMinutes'] as num).toInt(),
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      passingScore: (json['passingScore'] as num).toDouble(),
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      isPublished: json['isPublished'] as bool? ?? false,
    );
  }
}

class ExamSessionModel {
  final String id;
  final String tenantId;
  final String examId;
  final String examTitle;
  final int durationMinutes;
  final String studentId;
  final String? studentName;
  final String startedAt;
  final String status;
  final int remainingSeconds;
  final int totalQuestions;
  final int answeredQuestions;
  final List<ExamQuestionModel> questions;

  ExamSessionModel({
    required this.id,
    required this.tenantId,
    required this.examId,
    required this.examTitle,
    required this.durationMinutes,
    required this.studentId,
    this.studentName,
    required this.startedAt,
    required this.status,
    required this.remainingSeconds,
    required this.totalQuestions,
    required this.answeredQuestions,
    required this.questions,
  });

  factory ExamSessionModel.fromJson(Map<String, dynamic> json) {
    return ExamSessionModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      examId: json['examId'] as String,
      examTitle: json['examTitle'] as String,
      durationMinutes: (json['durationMinutes'] as num).toInt(),
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String?,
      startedAt: json['startedAt'] as String,
      status: json['status'] as String,
      remainingSeconds: (json['remainingSeconds'] as num).toInt(),
      totalQuestions: (json['totalQuestions'] as num).toInt(),
      answeredQuestions: (json['answeredQuestions'] as num).toInt(),
      questions: (json['questions'] as List<dynamic>?)
              ?.map((q) => ExamQuestionModel.fromJson(q as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class ExamResultModel {
  final String sessionId;
  final String examId;
  final String examTitle;
  final String studentName;
  final String classGroupName;
  final double score;
  final double maxScore;
  final double percentage;
  final double passingScore;
  final bool isPassed;
  final int totalQuestions;
  final int correctAnswersCount;
  final bool syncedToGrades;

  ExamResultModel({
    required this.sessionId,
    required this.examId,
    required this.examTitle,
    required this.studentName,
    required this.classGroupName,
    required this.score,
    required this.maxScore,
    required this.percentage,
    required this.passingScore,
    required this.isPassed,
    required this.totalQuestions,
    required this.correctAnswersCount,
    required this.syncedToGrades,
  });

  factory ExamResultModel.fromJson(Map<String, dynamic> json) {
    return ExamResultModel(
      sessionId: json['sessionId'] as String,
      examId: json['examId'] as String,
      examTitle: json['examTitle'] as String,
      studentName: json['studentName'] as String,
      classGroupName: json['classGroupName'] as String,
      score: (json['score'] as num).toDouble(),
      maxScore: (json['maxScore'] as num).toDouble(),
      percentage: (json['percentage'] as num).toDouble(),
      passingScore: (json['passingScore'] as num).toDouble(),
      isPassed: json['isPassed'] as bool,
      totalQuestions: (json['totalQuestions'] as num).toInt(),
      correctAnswersCount: (json['correctAnswersCount'] as num).toInt(),
      syncedToGrades: json['syncedToGrades'] as bool? ?? false,
    );
  }
}
