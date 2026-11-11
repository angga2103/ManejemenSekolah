import 'package:flutter/material.dart';
import '../models/pesantren_models.dart';
import '../services/pesantren_api_service.dart';

class TahfizJournalScreen extends StatefulWidget {
  final String studentId;
  final String studentName;
  final PesantrenApiService? apiService;

  const TahfizJournalScreen({
    super.key,
    required this.studentId,
    required this.studentName,
    this.apiService,
  });

  @override
  State<TahfizJournalScreen> createState() => _TahfizJournalScreenState();
}

class _TahfizJournalScreenState extends State<TahfizJournalScreen> {
  late final PesantrenApiService _api;
  bool _isLoading = true;
  
  String _selectedFilter = 'ALL'; // ALL, ZIYADAH, MUROJA_AH, PERMITS

  TahfizProgressSummaryModel? _progressSummary;
  List<TahfizRecordModel> _records = [];
  List<PesantrenPermitModel> _permits = [];

  @override
  void initState() {
    super.initState();
    _api = widget.apiService ?? PesantrenApiService();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      
    });

    try {
      final summary = await _api.fetchStudentProgress(widget.studentId);
      final records = await _api.fetchTahfizRecords(studentId: widget.studentId);
      final permits = await _api.fetchPesantrenPermits(studentId: widget.studentId);

      if (mounted) {
        setState(() {
          _progressSummary = summary;
          _records = records;
          _permits = permits;
          _isLoading = false;
        });
      }
    } catch (_) {
      // Fallback to offline/mock data for demonstration
      if (mounted) {
        setState(() {
          _progressSummary = TahfizProgressSummaryModel(
            studentId: widget.studentId,
            studentName: widget.studentName,
            studentNis: '2026001',
            totalJuzCompleted: 12,
            totalVersesMemorized: 1845,
            latestSurahName: 'An-Naba',
            latestAyatEnd: 40,
            latestJuz: 30,
            ziyadahCount: 38,
            murojaahCount: 52,
            lastRecordDate: DateTime.now(),
          );

          _records = [
            TahfizRecordModel(
              id: 'tr-1',
              studentId: widget.studentId,
              studentName: widget.studentName,
              studentNis: '2026001',
              musyrifName: 'Ustaz Abdullah, Lc.',
              halaqahGroupName: 'Halaqah Imam Ashim',
              recordType: 'ZIYADAH',
              surahNumber: 78,
              surahName: 'An-Naba',
              ayatStart: 1,
              ayatEnd: 40,
              juz: 30,
              fluencyRating: 'MUMTAZ',
              tajwidRating: 'MUMTAZ',
              notes: 'Makharijul huruf sangat fasih, ghunnah tepat',
              recordedAt: DateTime.now().subtract(const Duration(hours: 3)),
            ),
            TahfizRecordModel(
              id: 'tr-2',
              studentId: widget.studentId,
              studentName: widget.studentName,
              studentNis: '2026001',
              musyrifName: 'Ustaz Abdullah, Lc.',
              halaqahGroupName: 'Halaqah Imam Ashim',
              recordType: 'MUROJA_AH',
              surahNumber: 67,
              surahName: 'Al-Mulk',
              ayatStart: 1,
              ayatEnd: 30,
              juz: 29,
              fluencyRating: 'JAYYID_JIDDAN',
              tajwidRating: 'JAYYID',
              notes: 'Kelancaran stabil, perhatikan mad wajib muttashil',
              recordedAt: DateTime.now().subtract(const Duration(days: 1)),
            ),
          ];

          _permits = [
            PesantrenPermitModel(
              id: 'prm-1',
              studentId: widget.studentId,
              studentName: widget.studentName,
              studentNis: '2026001',
              permitType: 'PULANG_KE_RUMAH',
              reason: 'Libur Idul Adha bersama keluarga di Solo',
              pickupPersonName: 'H. Sulaiman Al-Faqih',
              pickupPersonRelation: 'Ayah Kandung',
              pickupPersonPhone: '081234567890',
              expectedDeparture: DateTime.now().add(const Duration(days: 2)),
              expectedReturn: DateTime.now().add(const Duration(days: 5)),
              actualDeparture: null,
              actualReturn: null,
              securityGateToken: 'GATE-20260815-F41A8C',
              status: 'APPROVED_BY_KEASRAMAAN',
              approvedByMusyrifName: 'Ustaz Abdullah, Lc.',
              approvedByKeasramaanName: 'K.H. Mansyur (Mudir Asrama)',
              notes: 'Izin telah diverifikasi',
              createdAt: DateTime.now().subtract(const Duration(days: 1)),
            ),
          ];
          _isLoading = false;
        });
      }
    }
  }

  void _showAddRecordBottomSheet() {
    final surahController = TextEditingController(text: "An-Nazi'at");
    final juzController = TextEditingController(text: '30');
    final startAyatController = TextEditingController(text: '1');
    final endAyatController = TextEditingController(text: '46');
    final notesController = TextEditingController(text: 'Makhraj huruf mutqin');
    String recordType = 'ZIYADAH';
    String fluencyRating = 'MUMTAZ';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Catat Setoran Tahfiz Qur\'an',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white70),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Tipe Setoran Toggle
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setSheetState(() => recordType = 'ZIYADAH'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: recordType == 'ZIYADAH'
                                    ? const Color(0xFF059669)
                                    : const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: recordType == 'ZIYADAH'
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFF334155),
                                ),
                              ),
                              child: const Center(
                                child: Text(
                                  'Ziyadah (Baru)',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setSheetState(() => recordType = 'MUROJA_AH'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: recordType == 'MUROJA_AH'
                                    ? const Color(0xFF2563EB)
                                    : const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: recordType == 'MUROJA_AH'
                                      ? const Color(0xFF3B82F6)
                                      : const Color(0xFF334155),
                                ),
                              ),
                              child: const Center(
                                child: Text(
                                  'Muroja\'ah (Ulang)',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextField(
                            controller: surahController,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: 'Nama Surah',
                              labelStyle: TextStyle(color: Colors.white60),
                              filled: true,
                              fillColor: Color(0xFF1E293B),
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: juzController,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: 'Juz',
                              labelStyle: TextStyle(color: Colors.white60),
                              filled: true,
                              fillColor: Color(0xFF1E293B),
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: startAyatController,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: 'Ayat Awal',
                              labelStyle: TextStyle(color: Colors.white60),
                              filled: true,
                              fillColor: Color(0xFF1E293B),
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: endAyatController,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: 'Ayat Akhir',
                              labelStyle: TextStyle(color: Colors.white60),
                              filled: true,
                              fillColor: Color(0xFF1E293B),
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: fluencyRating,
                      dropdownColor: const Color(0xFF1E293B),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: const InputDecoration(
                        labelText: 'Nilai Kelancaran',
                        labelStyle: TextStyle(color: Colors.white60),
                        filled: true,
                        fillColor: Color(0xFF1E293B),
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'MUMTAZ', child: Text('MUMTAZ (Sangat Fasih & Mutqin)')),
                        DropdownMenuItem(value: 'JAYYID_JIDDAN', child: Text('JAYYID JIDDAN (Lancar)')),
                        DropdownMenuItem(value: 'JAYYID', child: Text('JAYYID (Cukup Lancar)')),
                        DropdownMenuItem(value: 'MAQBUL', child: Text('MAQBUL (Masih Terbata)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setSheetState(() => fluencyRating = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: const InputDecoration(
                        labelText: 'Catatan Ustadz / Pembina',
                        labelStyle: TextStyle(color: Colors.white60),
                        filled: true,
                        fillColor: Color(0xFF1E293B),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: () {
                          final newRecord = TahfizRecordModel(
                            id: 'tr-${DateTime.now().millisecondsSinceEpoch}',
                            studentId: widget.studentId,
                            studentName: widget.studentName,
                            studentNis: '2026001',
                            musyrifName: 'Ustaz Abdullah, Lc.',
                            recordType: recordType,
                            surahNumber: 79,
                            surahName: surahController.text.trim(),
                            ayatStart: int.tryParse(startAyatController.text) ?? 1,
                            ayatEnd: int.tryParse(endAyatController.text) ?? 46,
                            juz: int.tryParse(juzController.text) ?? 30,
                            fluencyRating: fluencyRating,
                            tajwidRating: 'MUMTAZ',
                            notes: notesController.text.trim(),
                            recordedAt: DateTime.now(),
                          );

                          setState(() {
                            _records.insert(0, newRecord);
                          });

                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Setoran ${newRecord.surahName} berhasil dicatat.'),
                              backgroundColor: const Color(0xFF059669),
                            ),
                          );
                        },
                        child: const Text(
                          'Simpan Setoran Tahfiz',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Tahfiz & Asrama: ${widget.studentName}'),
        backgroundColor: const Color(0xFF047857),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF10B981)),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: const Color(0xFF10B981),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // 1. Progress Summary Card
                  _buildProgressSummaryCard(),
                  const SizedBox(height: 16),

                  // 2. Filter Selector Chips
                  _buildFilterChips(),
                  const SizedBox(height: 16),

                  // 3. Tab Content
                  if (_selectedFilter == 'PERMITS')
                    _buildPermitsList()
                  else
                    _buildRecordsList(),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddRecordBottomSheet,
        backgroundColor: const Color(0xFF059669),
        icon: const Icon(Icons.menu_book, color: Colors.white),
        label: const Text(
          'Setor Hafalan',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildProgressSummaryCard() {
    final summary = _progressSummary;
    final juzDone = summary?.totalJuzCompleted ?? 0;
    final totalJuz = 30;
    final percent = (juzDone / totalJuz).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF064E3B), Color(0xFF0F172A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF047857).withAlpha(128)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Capaian Hafalan Qur\'an (30 Juz)',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF059669),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$juzDone / $totalJuz Juz',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: percent,
              minHeight: 10,
              backgroundColor: const Color(0xFF1E293B),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMetricItem('Total Ayat', '${summary?.totalVersesMemorized ?? 0} Ayat'),
              _buildMetricItem('Ziyadah', '${summary?.ziyadahCount ?? 0} Kali'),
              _buildMetricItem('Muroja\'ah', '${summary?.murojaahCount ?? 0} Kali'),
              _buildMetricItem('Juz Terakhir', 'Juz ${summary?.latestJuz ?? 30}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10)),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      {'id': 'ALL', 'name': 'Semua Jurnal'},
      {'id': 'ZIYADAH', 'name': 'Ziyadah (Baru)'},
      {'id': 'MUROJA_AH', 'name': 'Muroja\'ah'},
      {'id': 'PERMITS', 'name': 'Izin Gerbang'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((f) {
          final isSelected = _selectedFilter == f['id'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(f['name']!),
              selected: isSelected,
              selectedColor: const Color(0xFF059669),
              backgroundColor: const Color(0xFF1E293B),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.white70,
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              onSelected: (_) {
                setState(() => _selectedFilter = f['id']!);
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildRecordsList() {
    final filtered = _records.where((r) {
      if (_selectedFilter == 'ALL') return true;
      return r.recordType == _selectedFilter;
    }).toList();

    if (filtered.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Text(
            'Belum ada riwayat setoran tahfiz',
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ),
      );
    }

    return Column(
      children: filtered.map((r) {
        final isZiyadah = r.recordType == 'ZIYADAH';

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isZiyadah
                              ? const Color(0xFF065F46)
                              : const Color(0xFF1E40AF),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isZiyadah ? 'ZIYADAH' : 'MUROJA\'AH',
                          style: TextStyle(
                            color: isZiyadah ? const Color(0xFF34D399) : Colors.blueAccent,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Juz ${r.juz}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: r.fluencyRating == 'MUMTAZ'
                          ? const Color(0xFF064E3B)
                          : const Color(0xFF1E3A8A),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      r.fluencyRating,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Surah ${r.surahName} (Ayat ${r.ayatStart} - ${r.ayatEnd})',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              if (r.notes != null && r.notes!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Catatan: ${r.notes}',
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Musyrif: ${r.musyrifName}',
                    style: const TextStyle(color: Colors.white60, fontSize: 10),
                  ),
                  Text(
                    '${r.recordedAt.day}/${r.recordedAt.month}/${r.recordedAt.year}',
                    style: const TextStyle(color: Colors.white60, fontSize: 10),
                  ),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPermitsList() {
    if (_permits.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Text(
            'Tidak ada pengajuan izin keluar santri',
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ),
      );
    }

    return Column(
      children: _permits.map((p) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF78350F),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      p.permitType,
                      style: const TextStyle(
                        color: Colors.amberAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF064E3B),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      p.status,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                p.reason,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Penjemput: ${p.pickupPersonName} (${p.pickupPersonRelation})',
                style: const TextStyle(color: Colors.white70, fontSize: 11),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'KODE GERBANG:',
                      style: TextStyle(
                        color: Colors.white60,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      p.securityGateToken,
                      style: const TextStyle(
                        color: Colors.amberAccent,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
