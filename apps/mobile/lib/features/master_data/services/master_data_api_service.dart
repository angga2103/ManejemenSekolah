import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/student_model.dart';

class MasterDataApiService {
  final Dio _dio;
  final SecureStorageService _storage;

  MasterDataApiService({
    Dio? dio,
    SecureStorageService? storage,
    String baseUrl = 'http://10.0.2.2:4000/api/v1',
  })  : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl, connectTimeout: const Duration(seconds: 10))),
        _storage = storage ?? SecureStorageService();

  Future<List<StudentModel>> fetchStudents({
    String? search,
    String? classGroupId,
    int page = 1,
  }) async {
    final token = await _storage.getAccessToken();
    final tenantId = await _storage.getTenantId();

    try {
      final response = await _dio.get(
        '/master-data/students',
        queryParameters: {
          if (search != null && search.isNotEmpty) 'search': search,
          if (classGroupId != null && classGroupId.isNotEmpty) 'classGroupId': classGroupId,
          'page': page,
          'limit': 50,
        },
        options: Options(
          headers: {
            if (token != null) 'Authorization': 'Bearer $token',
            if (tenantId != null) 'X-Tenant-ID': tenantId,
          },
        ),
      );

      final data = response.data['data'] ?? response.data;
      final studentList = data['data'] as List<dynamic>? ?? [];

      return studentList
          .map((item) => StudentModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal mengambil data santri');
    }
  }

  Future<Map<String, dynamic>> fetchStudentDetail(String studentId) async {
    final token = await _storage.getAccessToken();
    final tenantId = await _storage.getTenantId();

    try {
      final response = await _dio.get(
        '/master-data/students/$studentId',
        options: Options(
          headers: {
            if (token != null) 'Authorization': 'Bearer $token',
            if (tenantId != null) 'X-Tenant-ID': tenantId,
          },
        ),
      );

      return (response.data['data'] ?? response.data) as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal mengambil detail santri');
    }
  }
}
