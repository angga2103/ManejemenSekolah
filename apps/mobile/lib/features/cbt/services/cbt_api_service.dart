import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/cbt_models.dart';

class CbtApiService {
  final Dio _dio;
  final SecureStorageService _storage;

  CbtApiService({
    Dio? dio,
    SecureStorageService? storage,
    String baseUrl = 'http://10.0.2.2:4000/api/v1',
  })  : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl, connectTimeout: const Duration(seconds: 10))),
        _storage = storage ?? SecureStorageService();

  Future<Options> _getAuthOptions() async {
    final token = await _storage.getAccessToken();
    final tenantId = await _storage.getTenantId();
    return Options(
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
        if (tenantId != null) 'X-Tenant-ID': tenantId,
      },
    );
  }

  /// Fetch exams available for the student
  Future<List<ExamModel>> fetchExams() async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.get(
        '/cbt/exams',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final list = data['data'] as List<dynamic>? ?? [];

      return list
          .map((item) => ExamModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat jadwal ujian');
    }
  }

  /// Start CBT exam session with token
  Future<ExamSessionModel> startExamSession(String examId, String token) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.post(
        '/cbt/sessions/start',
        data: {
          'examId': examId,
          'token': token,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return ExamSessionModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memulai sesi ujian');
    }
  }

  /// Autosave student answer
  Future<void> submitAnswer(
    String sessionId,
    String questionId, {
    String? selectedOption,
    String? essayAnswer,
  }) async {
    final options = await _getAuthOptions();

    try {
      await _dio.post(
        '/cbt/sessions/$sessionId/answers',
        data: {
          'questionId': questionId,
          if (selectedOption != null) 'selectedOption': selectedOption,
          if (essayAnswer != null) 'essayAnswer': essayAnswer,
        },
        options: options,
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal menyimpan jawaban');
    }
  }

  /// Finalize exam session and calculate score
  Future<ExamResultModel> finishExamSession(String sessionId) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.post(
        '/cbt/sessions/$sessionId/finish',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return ExamResultModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal menyelesaikan ujian');
    }
  }
}
