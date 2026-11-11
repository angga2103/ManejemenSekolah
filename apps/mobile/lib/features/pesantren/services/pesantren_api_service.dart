import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/pesantren_models.dart';

class PesantrenApiService {
  final Dio _dio;
  final SecureStorageService _storage;

  PesantrenApiService({
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

  /// List dormitories & room capacities
  Future<List<DormitoryModel>> fetchDormitories() async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.get('/pesantren/dormitories', options: options);
      final data = response.data['data'] ?? response.data;
      final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
      return list
          .map((item) => DormitoryModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat data asrama');
    }
  }

  /// List halaqah groups
  Future<List<HalaqahGroupModel>> fetchHalaqahGroups() async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.get('/pesantren/tahfiz/halaqah', options: options);
      final data = response.data['data'] ?? response.data;
      final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
      return list
          .map((item) => HalaqahGroupModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat data halaqah');
    }
  }

  /// List tahfiz records with optional filter
  Future<List<TahfizRecordModel>> fetchTahfizRecords({
    String? studentId,
    String? recordType,
  }) async {
    final options = await _getAuthOptions();
    try {
      final queryParams = <String, dynamic>{
        if (studentId != null) 'studentId': studentId,
        if (recordType != null) 'recordType': recordType,
      };

      final response = await _dio.get(
        '/pesantren/tahfiz/records',
        queryParameters: queryParams,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
      return list
          .map((item) => TahfizRecordModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat riwayat tahfiz');
    }
  }

  /// Get student progress summary (total juz, verses, ziyadah vs murojaah)
  Future<TahfizProgressSummaryModel> fetchStudentProgress(String studentId) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.get(
        '/pesantren/tahfiz/students/$studentId/progress',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return TahfizProgressSummaryModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat capaian tahfiz');
    }
  }

  /// Record new tahfiz entry (Ziyadah or Muroja'ah)
  Future<TahfizRecordModel> recordTahfizEntry(Map<String, dynamic> payload) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.post(
        '/pesantren/tahfiz/records',
        data: payload,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return TahfizRecordModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal menyimpan setoran tahfiz');
    }
  }

  /// List pesantren permits (izin pulang / keluar kompleks)
  Future<List<PesantrenPermitModel>> fetchPesantrenPermits({String? studentId}) async {
    final options = await _getAuthOptions();
    try {
      final queryParams = <String, dynamic>{
        if (studentId != null) 'studentId': studentId,
      };

      final response = await _dio.get(
        '/pesantren/permits',
        queryParameters: queryParams,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
      return list
          .map((item) => PesantrenPermitModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat data izin santri');
    }
  }

  /// Submit new permit request
  Future<PesantrenPermitModel> createPesantrenPermit(Map<String, dynamic> payload) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.post(
        '/pesantren/permits',
        data: payload,
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return PesantrenPermitModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal mengajukan izin santri');
    }
  }

  /// Gate pass check-out or check-in validation
  Future<PesantrenPermitModel> verifyGatePass({
    required String gateToken,
    required String action, // CHECK_OUT or CHECK_IN
    required String checkedByEmployeeId,
    String? notes,
  }) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.post(
        '/pesantren/permits/gate-check',
        data: {
          'securityGateToken': gateToken,
          'action': action,
          'checkedByEmployeeId': checkedByEmployeeId,
          if (notes != null) 'notes': notes,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return PesantrenPermitModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal verifikasi gerbang');
    }
  }
}
