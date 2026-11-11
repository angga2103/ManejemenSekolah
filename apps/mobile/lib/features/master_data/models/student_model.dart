class StudentModel {
  final String id;
  final String nis;
  final String? nisn;
  final String fullName;
  final String gender;
  final String birthPlace;
  final String birthDate;
  final String status;
  final String? className;
  final int guardiansCount;

  StudentModel({
    required this.id,
    required this.nis,
    this.nisn,
    required this.fullName,
    required this.gender,
    required this.birthPlace,
    required this.birthDate,
    required this.status,
    this.className,
    this.guardiansCount = 0,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    return StudentModel(
      id: json['id'] as String,
      nis: json['nis'] as String,
      nisn: json['nisn'] as String?,
      fullName: json['fullName'] as String,
      gender: json['gender'] as String,
      birthPlace: json['birthPlace'] as String? ?? '-',
      birthDate: json['birthDate'] != null ? json['birthDate'].toString().split('T')[0] : '-',
      status: json['status'] as String? ?? 'ACTIVE',
      className: json['currentClass'] != null ? json['currentClass']['name'] as String? : null,
      guardiansCount: json['guardiansCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nis': nis,
        'nisn': nisn,
        'fullName': fullName,
        'gender': gender,
        'birthPlace': birthPlace,
        'birthDate': birthDate,
        'status': status,
        'className': className,
        'guardiansCount': guardiansCount,
      };
}
