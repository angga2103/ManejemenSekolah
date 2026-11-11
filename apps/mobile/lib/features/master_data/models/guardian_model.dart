class GuardianModel {
  final String id;
  final String fullName;
  final String phone;
  final String? email;
  final String relationshipType;
  final bool isPrimary;
  final bool hasFinancialAccess;
  final bool receiveWhatsapp;

  GuardianModel({
    required this.id,
    required this.fullName,
    required this.phone,
    this.email,
    required this.relationshipType,
    required this.isPrimary,
    required this.hasFinancialAccess,
    required this.receiveWhatsapp,
  });

  factory GuardianModel.fromJson(Map<String, dynamic> json) {
    return GuardianModel(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String?,
      relationshipType: json['relationshipType'] as String? ?? 'OTHER',
      isPrimary: json['isPrimary'] as bool? ?? false,
      hasFinancialAccess: json['hasFinancialAccess'] as bool? ?? true,
      receiveWhatsapp: json['receiveWhatsapp'] as bool? ?? true,
    );
  }
}
