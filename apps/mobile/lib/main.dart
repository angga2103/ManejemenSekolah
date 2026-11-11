import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/offline_status_bar.dart';

void main() {
  runApp(const EduSaaSApp());
}

class EduSaaSApp extends StatelessWidget {
  const EduSaaSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduSaaS Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const RolePreviewScreen(),
    );
  }
}

class RolePreviewScreen extends StatefulWidget {
  const RolePreviewScreen({super.key});

  @override
  State<RolePreviewScreen> createState() => _RolePreviewScreenState();
}

class _RolePreviewScreenState extends State<RolePreviewScreen> {
  String _selectedRole = 'Attendance Officer';
  bool _isOnline = true;
  int _pendingSyncCount = 0;

  final List<String> _roles = [
    'Attendance Officer',
    'Teacher',
    'Student',
    'Guardian',
    'Administrator',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'EduSaaS Mobile',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Pratinjau Peran: $_selectedRole',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: _isOnline ? 'Simulasi Offline' : 'Kembali Online',
            icon: Icon(
              _isOnline ? Icons.wifi : Icons.wifi_off,
              color: _isOnline ? Colors.green : Colors.red,
            ),
            onPressed: () {
              setState(() {
                _isOnline = !_isOnline;
                _pendingSyncCount = _isOnline ? 0 : 3;
              });
            },
          ),
          PopupMenuButton<String>(
            tooltip: 'Ganti Peran Pengguna',
            icon: const Icon(Icons.swap_horiz),
            onSelected: (role) => setState(() => _selectedRole = role),
            itemBuilder: (context) => _roles
                .map((r) => PopupMenuItem(value: r, child: Text(r)))
                .toList(),
          ),
        ],
      ),
      body: Column(
        children: [
          OfflineStatusBar(
            isOnline: _isOnline,
            pendingSyncCount: _pendingSyncCount,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: _buildRoleContent(_selectedRole),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleContent(String role) {
    switch (role) {
      case 'Attendance Officer':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBadge('Petugas Presensi / Satpam Gerbang'),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const Icon(Icons.qr_code_scanner, size: 64, color: Color(0xFF059669)),
                    const SizedBox(height: 12),
                    const Text(
                      'Pindai QR Santri',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Dukungan Penuh Verifikasi Offline (HMAC Signed Token)',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () {},
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Buka Pemindai Lapangan'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );

      case 'Teacher':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBadge('Ruang Kerja Guru & Musyrif'),
            const SizedBox(height: 12),
            _buildCardTile(Icons.assignment, 'Presensi & Jurnal Kelas 8A', 'KBM Aktif: Fiqih Ibadah'),
            _buildCardTile(Icons.menu_book, 'Setoran Tahfiz Sore', 'Halaqah 3 • 14 Santri Terdaftar'),
          ],
        );

      case 'Student':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBadge('Santri: Ahmad Fauzi (NIS: 20260114)'),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    Container(
                      height: 140,
                      width: 140,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: const Center(
                        child: Text(
                          '[QR Dinamis\nBerputar 60d]',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Tunjukkan ke Petugas untuk Presensi',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );

      case 'Guardian':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBadge('Wali Santri — Memantau: Ahmad Fauzi'),
            const SizedBox(height: 12),
            _buildCardTile(Icons.check_circle, 'Status Kehadiran Hari Ini', 'Hadir Salat Subuh & Kelas'),
            _buildCardTile(Icons.payment, 'Status Tagihan SPP', 'Lunas Bulan Ini (Rp 650.000)'),
            _buildCardTile(Icons.bookmark, 'Capaian Hafalan Terakhir', 'Juz 30 (Al-Mulk: 1-15)'),
          ],
        );

      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBadge('SaaS Developer Administrator'),
            const SizedBox(height: 12),
            _buildCardTile(Icons.admin_panel_settings, 'Status Node Server', '4 Node Cluster Aktif'),
            _buildCardTile(Icons.security, 'PostgreSQL RLS Filter', 'Terkonfigurasi dan Aktif'),
          ],
        );
    }
  }

  Widget _buildBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFD1FAE5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Color(0xFF065F46),
        ),
      ),
    );
  }

  Widget _buildCardTile(IconData icon, String title, String subtitle) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFD1FAE5),
          child: Icon(icon, color: const Color(0xFF059669)),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right, size: 20),
      ),
    );
  }
}
