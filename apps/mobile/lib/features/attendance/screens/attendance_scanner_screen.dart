import 'package:flutter/material.dart';
import '../models/attendance_model.dart';
import '../services/attendance_api_service.dart';
import '../services/offline_attendance_queue.dart';

class AttendanceScannerScreen extends StatefulWidget {
  final AttendanceApiService apiService;

  const AttendanceScannerScreen({
    super.key,
    required this.apiService,
  });

  @override
  State<AttendanceScannerScreen> createState() => _AttendanceScannerScreenState();
}

class _AttendanceScannerScreenState extends State<AttendanceScannerScreen> {
  final OfflineAttendanceQueue _queue = OfflineAttendanceQueue();
  bool _isLoading = false;
  String? _statusMessage;
  AttendanceSummaryModel? _summary;

  // Demo scan student selection
  String _selectedStudentId = '22222222-2222-2222-2222-222222222222';
  String _selectedStudentName = 'Ahmad Faiz Al-Faruq';
  String _attendanceType = 'CLASS';

  @override
  void initState() {
    super.initState();
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    try {
      final summary = await widget.apiService.getDailySummary();
      setState(() {
        _summary = summary;
      });
    } catch (_) {
      // Offline fallback: ignore summary error
    }
  }

  Future<void> _recordScan() async {
    setState(() {
      _isLoading = true;
      _statusMessage = null;
    });

    try {
      final res = await widget.apiService.recordAttendance(
        studentId: _selectedStudentId,
        studentName: _selectedStudentName,
        type: _attendanceType,
      );

      setState(() {
        _isLoading = false;
        if (res != null) {
          _statusMessage = 'Presensi Berhasil (${res.status}): ${res.studentName ?? _selectedStudentName}';
        } else {
          _statusMessage = 'Offline: Presensi disimpan dalam antrean lokal perangkat.';
        }
      });
      _loadSummary();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _statusMessage = 'Gagal mencatat: $e';
      });
    }
  }

  Future<void> _flushSync() async {
    setState(() {
      _isLoading = true;
      _statusMessage = null;
    });

    try {
      final result = await widget.apiService.flushOfflineQueue();
      setState(() {
        _isLoading = false;
        _statusMessage = 'Sinkronisasi Selesai: ${result['syncedCount']} tersinkron, ${result['duplicateCount']} duplikat.';
      });
      _loadSummary();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _statusMessage = 'Gagal sinkronisasi: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Presensi & Scanner EduSaaS'),
        actions: [
          StreamBuilder<int>(
            stream: _queue.queueCountStream,
            initialData: _queue.pendingCount,
            builder: (context, snapshot) {
              final count = snapshot.data ?? 0;
              return Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: Center(
                  child: Chip(
                    backgroundColor: count > 0 ? Colors.amber.shade700 : Colors.teal.shade700,
                    label: Text(
                      count > 0 ? '$count Antrean Offline' : 'Tersinkron',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Banner
            if (_statusMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16.0),
                padding: const EdgeInsets.all(12.0),
                decoration: BoxDecoration(
                  color: _statusMessage!.startsWith('Presensi Berhasil') || _statusMessage!.startsWith('Sinkronisasi Selesai')
                      ? Colors.green.shade50
                      : Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8.0),
                  border: Border.all(
                    color: _statusMessage!.startsWith('Presensi Berhasil') || _statusMessage!.startsWith('Sinkronisasi Selesai')
                        ? Colors.green.shade300
                        : Colors.orange.shade300,
                  ),
                ),
                child: Text(
                  _statusMessage!,
                  style: TextStyle(
                    color: _statusMessage!.startsWith('Presensi Berhasil') || _statusMessage!.startsWith('Sinkronisasi Selesai')
                        ? Colors.green.shade900
                        : Colors.orange.shade900,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),

            // Summary Card
            if (_summary != null)
              Card(
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Statistik Kehadiran Hari Ini',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Text(
                            '${_summary!.attendanceRatePercentage}%',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal, fontSize: 18),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatItem('Hadir', _summary!.presentCount, Colors.green),
                          _buildStatItem('Terlambat', _summary!.lateCount, Colors.amber.shade800),
                          _buildStatItem('Sakit/Izin', _summary!.sickCount + _summary!.permissionCount, Colors.blue),
                          _buildStatItem('Alpa', _summary!.absentCount, Colors.red),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 16),

            // Scanner Simulator Card
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Simulasi Pemindaian Barcode / Kartu Santri',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedStudentId,
                      decoration: const InputDecoration(
                        labelText: 'Pilih Santri yang Dipindai',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: '22222222-2222-2222-2222-222222222222',
                          child: Text('Ahmad Faiz Al-Faruq (2026001)'),
                        ),
                        DropdownMenuItem(
                          value: '33333333-3333-3333-3333-333333333333',
                          child: Text('Fathimah Azzahra (2026002)'),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedStudentId = val;
                            _selectedStudentName = val.startsWith('2') ? 'Ahmad Faiz Al-Faruq' : 'Fathimah Azzahra';
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _attendanceType,
                      decoration: const InputDecoration(
                        labelText: 'Jenis Kegiatan Presensi',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'CLASS', child: Text('Kelas Formal (Sekolah)')),
                        DropdownMenuItem(value: 'DORMITORY', child: Text('Absen Malam Asrama')),
                        DropdownMenuItem(value: 'PRAYER', child: Text('Sholat Berjamaah')),
                        DropdownMenuItem(value: 'PESANTREN_ACTIVITY', child: Text('Kegiatan / Halaqah')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _attendanceType = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _isLoading ? null : _recordScan,
                      icon: const Icon(Icons.qr_code_scanner),
                      label: Text(_isLoading ? 'Memproses...' : 'Catat Presensi (Scan)'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14.0),
                        backgroundColor: Colors.teal.shade700,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Offline Sync Controls
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Sinkronisasi Batch Offline',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          '${_queue.pendingCount} data',
                          style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.blueGrey),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Data hasil scan saat koneksi terputus disimpan di SQLite lokal dan otomatis di-push secara batch ke server.',
                      style: TextStyle(fontSize: 13, color: Colors.black54),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: _isLoading || _queue.pendingCount == 0 ? null : _flushSync,
                      icon: const Icon(Icons.sync),
                      label: const Text('Kirim Data Antrean ke Server'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12.0),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, int count, Color color) {
    return Column(
      children: [
        Text(
          '$count',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.black54),
        ),
      ],
    );
  }
}
