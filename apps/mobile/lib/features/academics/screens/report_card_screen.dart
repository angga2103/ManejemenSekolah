import 'package:flutter/material.dart';
import '../models/academic_models.dart';
import '../services/academics_api_service.dart';

class ReportCardScreen extends StatefulWidget {
  final String? studentId;

  const ReportCardScreen({super.key, this.studentId});

  @override
  State<ReportCardScreen> createState() => _ReportCardScreenState();
}

class _ReportCardScreenState extends State<ReportCardScreen> with SingleTickerProviderStateMixin {
  late final AcademicsApiService _apiService;
  late final TabController _tabController;

  bool _isLoading = true;
  String? _errorMessage;
  List<ReportCardModel> _reportCards = [];
  ReportCardModel? _selectedReportCard;

  @override
  void initState() {
    super.initState();
    _apiService = AcademicsApiService();
    _tabController = TabController(length: 2, vsync: this);
    _loadReportCards();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadReportCards() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await _apiService.fetchReportCards(studentId: widget.studentId);
      setState(() {
        _reportCards = list;
        if (list.isNotEmpty) {
          _selectedReportCard = list.first;
        }
        _isLoading = false;
      });

      // If we have a report card, fetch full detail with subjects
      if (_selectedReportCard != null) {
        final detail = await _apiService.fetchReportCardDetail(_selectedReportCard!.id);
        if (mounted) {
          setState(() {
            _selectedReportCard = detail;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Color _getPredicateColor(String predicate) {
    switch (predicate) {
      case 'A':
        return const Color(0xFF059669);
      case 'B':
        return Colors.blue;
      case 'C':
        return Colors.amber.shade700;
      default:
        return Colors.red.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Rapor Santri Digital',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadReportCards,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.blue),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadReportCards,
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      );
    }

    if (_selectedReportCard == null) {
      return const Center(
        child: Text(
          'Belum ada buku rapor yang diterbitkan untuk semester ini.',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
      );
    }

    final rc = _selectedReportCard!;
    final formalSubjects = rc.subjects
        .where((s) => s.curriculumType != 'PESANTREN_DINIYAH')
        .toList();
    final pesantrenSubjects = rc.subjects
        .where((s) => s.curriculumType == 'PESANTREN_DINIYAH')
        .toList();

    return RefreshIndicator(
      onRefresh: _loadReportCards,
      child: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Semester selector if multiple exist
          if (_reportCards.length > 1)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: rc.id,
                  isExpanded: true,
                  items: _reportCards.map((item) {
                    return DropdownMenuItem<String>(
                      value: item.id,
                      child: Text(
                        '${item.academicYearName} - Semester ${item.semester}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    );
                  }).toList(),
                  onChanged: (id) {
                    if (id != null) {
                      final selected = _reportCards.firstWhere((r) => r.id == id);
                      setState(() {
                        _selectedReportCard = selected;
                      });
                      _apiService.fetchReportCardDetail(id).then((detail) {
                        if (mounted) {
                          setState(() {
                            _selectedReportCard = detail;
                          });
                        }
                      });
                    }
                  },
                ),
              ),
            ),

          // Header Card (Prestasi Kumulatif & Peringkat)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.25),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          rc.studentName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'NIS: ${rc.studentNis} • ${rc.classGroupName}',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    if (rc.ranking != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '🥇 Rank ${rc.ranking}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMetricItem(
                        'Rata-rata',
                        rc.finalAverage.toStringAsFixed(1),
                        Colors.white,
                      ),
                      _buildMetricItem(
                        'Predikat',
                        rc.overallPredicate == 'A'
                            ? 'A (Mumtaz)'
                            : rc.overallPredicate == 'B'
                                ? 'B (Jayyid Jiddan)'
                                : 'C (Jayyid)',
                        const Color(0xFF6EE7B7),
                      ),
                      _buildMetricItem(
                        'Kehadiran',
                        '${rc.attendanceSummary.presentCount} Hari',
                        Colors.white,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Presensi Ringkas
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Rekapitulasi Presensi & Kehadiran',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildAttendanceChip('Hadir', rc.attendanceSummary.presentCount, const Color(0xFF059669)),
                    _buildAttendanceChip('Terlambat', rc.attendanceSummary.lateCount, Colors.blue),
                    _buildAttendanceChip('Sakit', rc.attendanceSummary.sickCount, Colors.amber),
                    _buildAttendanceChip('Izin', rc.attendanceSummary.permissionCount, Colors.purple),
                    _buildAttendanceChip('Alpa', rc.attendanceSummary.absentCount, Colors.red),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Dual Curricula Tab Selector
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                TabBar(
                  controller: _tabController,
                  labelColor: const Color(0xFF1E3A8A),
                  unselectedLabelColor: const Color(0xFF64748B),
                  indicatorColor: const Color(0xFF1E3A8A),
                  indicatorWeight: 3,
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  tabs: [
                    Tab(
                      text: '🏫 Muatan Nasional (${formalSubjects.length})',
                    ),
                    Tab(
                      text: '🕌 Diniyah Pesantren (${pesantrenSubjects.length})',
                    ),
                  ],
                ),
                SizedBox(
                  height: 380,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildSubjectList(formalSubjects),
                      _buildSubjectList(pesantrenSubjects),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Catatan Wali Kelas
          if (rc.remarks != null && rc.remarks!.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Catatan Wali Kelas / Pembina',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Color(0xFF166534),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '"${rc.remarks}"',
                    style: const TextStyle(
                      fontStyle: FontStyle.italic,
                      fontSize: 12,
                      color: Color(0xFF14532D),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.white.withValues(alpha: 0.8),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: valueColor,
          ),
        ),
      ],
    );
  }

  Widget _buildAttendanceChip(String label, int count, Color color) {
    return Column(
      children: [
        Text(
          '$count',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectList(List<SubjectScoreSummaryModel> list) {
    if (list.isEmpty) {
      return const Center(
        child: Text(
          'Tidak ada mata pelajaran terdaftar pada kelompok ini.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: list.length,
      separatorBuilder: (_, __) => const Divider(height: 16),
      itemBuilder: (context, index) {
        final item = list[index];
        final predColor = _getPredicateColor(item.predicate);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    item.subjectName,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: predColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${item.finalScore.toStringAsFixed(1)} • ${item.predicate}',
                    style: TextStyle(
                      color: predColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              item.competencyDescription,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF475569),
              ),
            ),
          ],
        );
      },
    );
  }
}
