class TenantSubscriptionModel {
  final String id;
  final String tier;
  final int maxStudents;
  final List<String> enabledModules;
  final DateTime startDate;
  final DateTime endDate;
  final bool isActive;
  final int daysRemaining;

  TenantSubscriptionModel({
    required this.id,
    required this.tier,
    required this.maxStudents,
    required this.enabledModules,
    required this.startDate,
    required this.endDate,
    required this.isActive,
    required this.daysRemaining,
  });

  factory TenantSubscriptionModel.fromJson(Map<String, dynamic> json) {
    return TenantSubscriptionModel(
      id: json['id'] as String? ?? '',
      tier: json['tier'] as String? ?? 'BASIC',
      maxStudents: (json['maxStudents'] as num?)?.toInt() ?? 500,
      enabledModules: (json['enabledModules'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      startDate: DateTime.tryParse(json['startDate']?.toString() ?? '') ??
          DateTime.now(),
      endDate: DateTime.tryParse(json['endDate']?.toString() ?? '') ??
          DateTime.now(),
      isActive: json['isActive'] as bool? ?? true,
      daysRemaining: (json['daysRemaining'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tier': tier,
      'maxStudents': maxStudents,
      'enabledModules': enabledModules,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'isActive': isActive,
      'daysRemaining': daysRemaining,
    };
  }

  bool isModuleEnabled(String moduleKey) {
    return enabledModules.contains(moduleKey.toUpperCase());
  }
}

class SystemHealthModel {
  final String status;
  final int latencyMs;
  final int uptimeSeconds;
  final double heapUsedMb;

  SystemHealthModel({
    required this.status,
    required this.latencyMs,
    required this.uptimeSeconds,
    required this.heapUsedMb,
  });

  factory SystemHealthModel.fromJson(Map<String, dynamic> json) {
    final db = json['database'] as Map<String, dynamic>? ?? {};
    final mem = json['memory'] as Map<String, dynamic>? ?? {};
    return SystemHealthModel(
      status: json['status'] as String? ?? 'HEALTHY',
      latencyMs: (db['latencyMs'] as num?)?.toInt() ?? 0,
      uptimeSeconds: (json['uptimeSeconds'] as num?)?.toInt() ?? 0,
      heapUsedMb: (mem['heapUsedMb'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class LicenseKeyModel {
  final String tenantId;
  final String tenantSlug;
  final String tier;
  final int maxStudents;
  final List<String> enabledModules;
  final String validUntil;
  final String licenseKey;
  final String signature;

  LicenseKeyModel({
    required this.tenantId,
    required this.tenantSlug,
    required this.tier,
    required this.maxStudents,
    required this.enabledModules,
    required this.validUntil,
    required this.licenseKey,
    required this.signature,
  });

  factory LicenseKeyModel.fromJson(Map<String, dynamic> json) {
    return LicenseKeyModel(
      tenantId: json['tenantId'] as String? ?? '',
      tenantSlug: json['tenantSlug'] as String? ?? '',
      tier: json['tier'] as String? ?? 'BASIC',
      maxStudents: (json['maxStudents'] as num?)?.toInt() ?? 500,
      enabledModules: (json['enabledModules'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      validUntil: json['validUntil'] as String? ?? '',
      licenseKey: json['licenseKey'] as String? ?? '',
      signature: json['signature'] as String? ?? '',
    );
  }
}
