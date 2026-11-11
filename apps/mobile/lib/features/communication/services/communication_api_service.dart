import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/communication_models.dart';

class CommunicationApiService {
  final Dio _dio;
  final SecureStorageService _storage;

  CommunicationApiService({
    Dio? dio,
    SecureStorageService? storage,
    String baseUrl = 'http://10.0.2.2:4000/api/v1',
  })  : _dio = dio ??
            Dio(BaseOptions(
                baseUrl: baseUrl,
                connectTimeout: const Duration(seconds: 10))),
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

  /// List violations with optional student filter
  Future<List<ViolationModel>> fetchViolations({String? studentId}) async {
    final options = await _getAuthOptions();
    try {
      final queryParams = <String, dynamic>{
        if (studentId != null) 'studentId': studentId,
      };

      final response = await _dio.get(
        '/communication/violations',
        queryParameters: queryParams,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
      return list
          .map((item) => ViolationModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat catatan pelanggaran');
    }
  }

  /// Fetch student discipline points and warning letter status
  Future<StudentDisciplineSummaryModel> fetchStudentDisciplineSummary(String studentId) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.get(
        '/communication/students/$studentId/discipline',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return StudentDisciplineSummaryModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat rekap poin santri');
    }
  }

  /// Record new violation
  Future<ViolationModel> recordViolation(Map<String, dynamic> payload) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.post(
        '/communication/violations',
        data: payload,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return ViolationModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal mencatat pelanggaran');
    }
  }

  /// List student achievements
  Future<List<AchievementModel>> fetchAchievements({String? studentId}) async {
    final options = await _getAuthOptions();
    try {
      final queryParams = <String, dynamic>{
        if (studentId != null) 'studentId': studentId,
      };

      final response = await _dio.get(
        '/communication/achievements',
        queryParameters: queryParams,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
      return list
          .map((item) => AchievementModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat daftar prestasi');
    }
  }

  /// List confidential counseling sessions
  Future<List<CounselingModel>> fetchCounselingSessions({
    String? studentId,
    bool? followUpOnly,
  }) async {
    final options = await _getAuthOptions();
    try {
      final queryParams = <String, dynamic>{
        if (studentId != null) 'studentId': studentId,
        if (followUpOnly != null) 'followUpOnly': followUpOnly.toString(),
      };

      final response = await _dio.get(
        '/communication/counseling',
        queryParameters: queryParams,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
      return list
          .map((item) => CounselingModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat catatan konseling');
    }
  }

  /// List complaints
  Future<List<ComplaintTicketModel>> fetchComplaints() async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.get(
        '/communication/complaints',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
      return list
          .map((item) => ComplaintTicketModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat tiket pengaduan');
    }
  }

  /// Create new confidential complaint
  Future<ComplaintTicketModel> createComplaint(Map<String, dynamic> payload) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.post(
        '/communication/complaints',
        data: payload,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return ComplaintTicketModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal mengirimkan pengaduan');
    }
  }
}
