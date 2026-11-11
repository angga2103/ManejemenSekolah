import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/subscription_models.dart';

class SubscriptionApiService {
  final Dio _dio;
  final SecureStorageService _storage;

  SubscriptionApiService({
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

  /// Get current tenant's active subscription and quota
  Future<TenantSubscriptionModel> fetchTenantSubscription(String tenantId) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.get(
        '/control-center/tenants/$tenantId/subscription',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return TenantSubscriptionModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(
          e.response?.data?['message'] ?? 'Gagal memuat status langganan tenant');
    }
  }

  /// Verify if module is enabled for current tenant
  Future<bool> verifyModuleAccess(String moduleKey) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.get(
        '/control-center/verify-module/$moduleKey',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return data['allowed'] as bool? ?? false;
    } on DioException {
      return false;
    }
  }

  /// Fetch system health metric for Super Admin / Supervisor
  Future<SystemHealthModel> fetchSystemHealth() async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.get(
        '/control-center/metrics',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return SystemHealthModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(
          e.response?.data?['message'] ?? 'Gagal mengambil metrik kesehatan server');
    }
  }
}
