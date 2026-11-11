import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/auth_user.dart';

class AuthApiService {
  final Dio _dio;
  final SecureStorageService _storage;

  AuthApiService({
    Dio? dio,
    SecureStorageService? storage,
    String baseUrl = 'http://10.0.2.2:4000/api/v1', // Android emulator default
  })  : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl, connectTimeout: const Duration(seconds: 10))),
        _storage = storage ?? SecureStorageService();

  Future<AuthUser> login({
    required String identifier,
    required String password,
    String? tenantSlug,
  }) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'identifier': identifier,
        'password': password,
        if (tenantSlug != null && tenantSlug.isNotEmpty) 'tenantSlug': tenantSlug,
      });

      final data = response.data['data'] ?? response.data;
      final tokens = data['tokens'];
      final userJson = data['user'];

      if (tokens != null) {
        await _storage.saveTokens(
          accessToken: tokens['accessToken'] as String,
          refreshToken: tokens['refreshToken'] as String,
          tenantId: userJson['tenantId'] as String,
        );
      }

      return AuthUser.fromJson(userJson as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ?? e.message ?? 'Login gagal';
      throw Exception(message);
    }
  }

  Future<AuthUser?> getMe() async {
    final token = await _storage.getAccessToken();
    if (token == null) return null;

    try {
      final response = await _dio.get(
        '/auth/me',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      final data = response.data['data'] ?? response.data;
      return AuthUser.fromJson(data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    final token = await _storage.getAccessToken();
    final refreshToken = await _storage.getRefreshToken();
    if (token != null) {
      try {
        await _dio.post(
          '/auth/logout',
          data: {'refreshToken': refreshToken},
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );
      } catch (_) {}
    }
    await _storage.clearAll();
  }
}
