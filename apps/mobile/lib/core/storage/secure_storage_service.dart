import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String _tokenKey = 'auth_access_token';
  static const String _refreshTokenKey = 'auth_refresh_token';
  static const String _tenantIdKey = 'current_tenant_id';

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required String tenantId,
  }) async {
    await _storage.write(key: _tokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
    await _storage.write(key: _tenantIdKey, value: tenantId);
  }

  Future<String?> getAccessToken() => _storage.read(key: _tokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);
  Future<String?> getTenantId() => _storage.read(key: _tenantIdKey);

  Future<void> clearAll() => _storage.deleteAll();
}
