import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/academic_models.dart';

class AcademicsApiService {
  final Dio _dio;
  final SecureStorageService _storage;

  AcademicsApiService({
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

  /// Fetch list of digital report cards (accessible to students, guardians, and teachers)
  Future<List<ReportCardModel>> fetchReportCards({
    String? studentId,
    String? classGroupId,
    String? academicYearId,
    String? semester,
    int page = 1,
  }) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.get(
        '/report-cards',
        queryParameters: {
          if (studentId != null && studentId.isNotEmpty) 'studentId': studentId,
          if (classGroupId != null && classGroupId.isNotEmpty) 'classGroupId': classGroupId,
          if (academicYearId != null && academicYearId.isNotEmpty) 'academicYearId': academicYearId,
          if (semester != null && semester.isNotEmpty) 'semester': semester,
          'page': page,
          'limit': 20,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final rcList = data['data'] as List<dynamic>? ?? [];

      return rcList
          .map((item) => ReportCardModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat buku rapor digital');
    }
  }

  /// Fetch single complete report card by ID
  Future<ReportCardModel> fetchReportCardDetail(String id) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.get(
        '/report-cards/$id',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return ReportCardModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat detail rapor');
    }
  }

  /// Fetch subject scores breakdown for a student
  Future<List<SubjectScoreSummaryModel>> fetchStudentSubjectSummary(
    String studentId,
    String academicYearId, {
    int kkm = 75,
  }) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.get(
        '/grades/students/$studentId/summary',
        queryParameters: {
          'academicYearId': academicYearId,
          'kkm': kkm,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final list = data as List<dynamic>? ?? [];

      return list
          .map((item) => SubjectScoreSummaryModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat rekapitulasi nilai mata pelajaran');
    }
  }
}
