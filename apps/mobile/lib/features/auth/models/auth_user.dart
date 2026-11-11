class AuthUser {
  final String id;
  final String tenantId;
  final String? email;
  final String? phone;
  final String fullName;
  final List<UserRoleItem> roles;
  final UserRoleItem activeRole;

  AuthUser({
    required this.id,
    required this.tenantId,
    this.email,
    this.phone,
    required this.fullName,
    required this.roles,
    required this.activeRole,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      fullName: json['fullName'] as String? ?? 'Pengguna',
      roles: (json['roles'] as List<dynamic>? ?? [])
          .map((r) => UserRoleItem.fromJson(r as Map<String, dynamic>))
          .toList(),
      activeRole: json['activeRole'] != null
          ? UserRoleItem.fromJson(json['activeRole'] as Map<String, dynamic>)
          : UserRoleItem(id: 'default', name: 'User', slug: 'user'),
    );
  }
}

class UserRoleItem {
  final String id;
  final String name;
  final String slug;
  final List<String> permissions;

  UserRoleItem({
    required this.id,
    required this.name,
    required this.slug,
    this.permissions = const [],
  });

  factory UserRoleItem.fromJson(Map<String, dynamic> json) {
    return UserRoleItem(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      permissions: (json['permissions'] as List<dynamic>? ?? [])
          .map((p) => p.toString())
          .toList(),
    );
  }
}
