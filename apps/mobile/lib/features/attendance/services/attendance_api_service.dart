import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/attendance_model.dart';
import 'offline_attendance_queue.dart';

class AttendanceApiService {
  final Dio _dio;
  final SecureStorageService _storage;
  final OfflineAttendanceQueue _queue = OfflineAttendanceQueue();

  AttendanceApiService({
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

  /// Verify and record dynamic QR scan
  Future<AttendanceModel> verifyDynamicQr({
    required String token,
    required String studentId,
    String? deviceId,
  }) async {
    final options = await _getAuthOptions();
    try {
      final response = await _dio.post(
        '/attendance/scan-qr',
        data: {
          'token': token,
          'studentId': studentId,
          'deviceId': deviceId ?? 'flutter_mobile_client',
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return AttendanceModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memverifikasi QR presensi');
    }
  }

  /// Record attendance (or fallback to offline queue if network fails)
  Future<AttendanceModel?> recordAttendance({
    required String studentId,
    required String studentName,
    String type = 'CLASS',
    String status = 'PRESENT',
    String? checkInTime,
  }) async {
    final now = DateTime.now();
    final timeStr = checkInTime ?? now.toIso8601String();
    final dateStr = timeStr.split('T')[0];

    try {
      final options = await _getAuthOptions();
      final response = await _dio.post(
        '/attendance/record',
        data: {
          'studentId': studentId,
          'type': type,
          'status': status,
          'method': 'BARCODE',
          'recordedDate': dateStr,
          'checkInTime': timeStr,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return AttendanceModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      // If server returned 4xx (e.g. invalid student), rethrow
      if (e.response?.statusCode != null && e.response!.statusCode! >= 400 && e.response!.statusCode! < 500) {
        throw Exception(e.response?.data?['message'] ?? 'Permintaan presensi ditolak oleh server');
      }

      // Network unreachable / timeout: enqueue to offline write queue
      final offlineItem = OfflineScanItem(
        clientRecordId: 'offline_${DateTime.now().millisecondsSinceEpoch}_$studentId',
        studentId: studentId,
        studentName: studentName,
        type: type,
        status: status,
        recordedDate: dateStr,
        checkInTime: timeStr,
        deviceId: 'flutter_mobile_offline',
      );
      _queue.enqueue(offlineItem);
      return null;
    } catch (_) {
      final offlineItem = OfflineScanItem(
        clientRecordId: 'offline_${DateTime.now().millisecondsSinceEpoch}_$studentId',
        studentId: studentId,
        studentName: studentName,
        type: type,
        status: status,
        recordedDate: dateStr,
        checkInTime: timeStr,
        deviceId: 'flutter_mobile_offline',
      );
      _queue.enqueue(offlineItem);
      return null;
    }
  }

  /// Flush offline queue to server batch sync endpoint
  Future<Map<String, dynamic>> flushOfflineQueue() async {
    final pending = _queue.queue;
    if (pending.isEmpty) {
      return {'syncedCount': 0, 'duplicateCount': 0, 'failedCount': 0};
    }

    final recordsJson = pending.map((item) => item.toSyncJson()).toList();

    try {
      final options = await _getAuthOptions();
      final response = await _dio.post(
        '/attendance/sync',
        data: {
          'deviceId': 'flutter_mobile_client',
          'batchTimestamp': DateTime.now().toIso8601String(),
          'records': recordsJson,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      _queue.clear();
      return data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal melakukan sinkronisasi batch presensi');
    }
  }

  /// Fetch daily attendance summary
  Future<AttendanceSummaryModel> getDailySummary({String? date, String type = 'CLASS'}) async {
    final dateParam = date ?? DateTime.now().toIso8601String().split('T')[0];
    final options = await _getAuthOptions();

    try {
      final response = await _dio.get(
        '/attendance/summary',
        queryParameters: {
          'date': dateParam,
          'type': type,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return AttendanceSummaryModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat ringkasan presensi');
    }
  }
}
