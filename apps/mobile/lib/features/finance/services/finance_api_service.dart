import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/finance_model.dart';

class FinanceApiService {
  final Dio _dio;
  final SecureStorageService _storage;

  FinanceApiService({
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

  /// Fetch student invoices for guardian / parent
  Future<List<InvoiceModel>> fetchInvoices({
    String? status,
    String? studentId,
    int page = 1,
  }) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.get(
        '/invoices',
        queryParameters: {
          if (status != null && status.isNotEmpty) 'status': status,
          if (studentId != null && studentId.isNotEmpty) 'studentId': studentId,
          'page': page,
          'limit': 20,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      final invoiceList = data['data'] as List<dynamic>? ?? [];

      return invoiceList
          .map((item) => InvoiceModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat data tagihan');
    }
  }

  /// Process direct payment / cash collection
  Future<Map<String, dynamic>> processPayment({
    required String invoiceId,
    required double amount,
    required String paymentMethod,
    String? idempotencyKey,
  }) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.post(
        '/payments',
        data: {
          'invoiceId': invoiceId,
          'amountPaid': amount,
          'amount': amount,
          'paymentMethod': paymentMethod,
          'idempotencyKey': idempotencyKey,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memproses pembayaran');
    }
  }

  /// Generate simulated QRIS or Virtual Account
  Future<Map<String, dynamic>> simulateGatewayCharge({
    required String invoiceId,
    required String paymentMethod,
    String bankCode = 'BSI',
  }) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.post(
        '/payments/simulate-gateway',
        data: {
          'invoiceId': invoiceId,
          'paymentMethod': paymentMethod,
          'bankCode': bankCode,
        },
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal membuat tagihan gateway');
    }
  }

  /// Fetch digital receipt
  Future<DigitalReceiptModel> fetchReceipt(String paymentId) async {
    final options = await _getAuthOptions();

    try {
      final response = await _dio.get(
        '/payments/$paymentId/receipt',
        options: options,
      );

      final data = response.data['data'] ?? response.data;
      return DigitalReceiptModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['message'] ?? e.message ?? 'Gagal memuat kuitansi pembayaran');
    }
  }
}
