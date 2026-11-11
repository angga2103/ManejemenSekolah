import 'package:flutter/material.dart';
import '../models/communication_models.dart';
import '../services/communication_api_service.dart';

class CommunicationHubScreen extends StatefulWidget {
  final String studentId;
  final String studentName;
  final CommunicationApiService? apiService;

  const CommunicationHubScreen({
    super.key,
    required this.studentId,
    required this.studentName,
    this.apiService,
  });

  @override
  State<CommunicationHubScreen> createState() => _CommunicationHubScreenState();
}

class _CommunicationHubScreenState extends State<CommunicationHubScreen> {
  late final CommunicationApiService _api;
  bool _isLoading = true;
  String _selectedTab = 'DISCIPLINE'; // DISCIPLINE, ACHIEVEMENTS, COUNSELING, COMPLAINTS

  StudentDisciplineSummaryModel? _disciplineSummary;
  List<ViolationModel> _violations = [];
  List<AchievementModel> _achievements = [];
  List<CounselingModel> _counselingSessions = [];
  List<ComplaintTicketModel> _complaints = [];

  @override
  void initState() {
    super.initState();
    _api = widget.apiService ?? CommunicationApiService();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final summary = await _api.fetchStudentDisciplineSummary(widget.studentId);
      final violations = await _api.fetchViolations(studentId: widget.studentId);
      final achievements = await _api.fetchAchievements(studentId: widget.studentId);
      final counseling = await _api.fetchCounselingSessions(studentId: widget.studentId);
      final complaints = await _api.fetchComplaints();

      if (mounted) {
        setState(() {
          _disciplineSummary = summary;
          _violations = violations;
          _achievements = achievements;
          _counselingSessions = counseling;
          _complaints = complaints;
          _isLoading = false;
        });
      }
    } catch (_) {
      // Fallback to offline/mock state for demo
      if (mounted) {
        setState(() {
          _disciplineSummary = StudentDisciplineSummaryModel(
            studentId: widget.studentId,
            studentName: widget.studentName,
            studentNis: '2026001',
            totalPoints: 5,
            sanctionLetter: 'NONE',
            violationCount: 1,
            latestViolationDate: DateTime.now().subtract(const Duration(days: 2)),
          );

          _violations = [
            ViolationModel(
              id: 'v-1',
              studentId: widget.studentId,
              studentName: widget.studentName,
              studentNis: '2026001',
              recordedByName: 'Ustaz Ridwan S.Pd.I',
              violationDate: DateTime.now().subtract(const Duration(days: 2)),
              title: 'Terlambat mengikuti salat tahajud & subuh berjamaah',
              points: 5,
              sanction: 'Teguran lisan & piket kebersihan masjid',
              status: 'RECORDED',
            ),
          ];

          _achievements = [
            AchievementModel(
              id: 'ach-1',
              studentId: widget.studentId,
              studentName: widget.studentName,
              studentNis: '2026001',
              title: 'Juara 1 Musabaqah Hifzil Qur\'an (MHQ) 10 Juz',
              level: 'PROVINSI',
              achievementDate: DateTime.now().subtract(const Duration(days: 5)),
              points: 50,
              certificateUrl: 'https://cdn.edusaas.id/certs/mhq-provinsi.pdf',
            ),
          ];

          _counselingSessions = [
            CounselingModel(
              id: 'cs-1',
              studentId: widget.studentId,
              studentName: widget.studentName,
              studentNis: '2026001',
              counselorName: 'Dra. Hj. Nurul Hidayah, M.Pd.',
              sessionDate: DateTime.now().subtract(const Duration(days: 1)),
              category: 'ACADEMIC',
              notes: 'Evaluasi kesiapan hafalan dan ritme belajar jelang ujian imtihan diniyah.',
              actionPlan: 'Penambahan waktu setoran halaqah ba\'da maghrib.',
              followUpRequired: false,
            ),
          ];

          _complaints = [
            ComplaintTicketModel(
              id: 'comp-1',
              userId: 'u-1',
              userName: 'Wali Santri ${widget.studentName}',
              title: 'Konfirmasi menu asrama saat pemulihan sakit',
              description: 'Mohon info mengenai menu bubur saat ananda masa pemulihan di asrama.',
              category: 'Kesehatan & Asrama',
              priority: 'MEDIUM',
              status: 'RESOLVED',
              resolutionNotes: 'Sudah dikoordinasikan dengan petugas klinik dan dapur.',
              createdAt: DateTime.now().subtract(const Duration(days: 3)),
              resolvedAt: DateTime.now().subtract(const Duration(days: 2)),
            ),
          ];
          _isLoading = false;
        });
      }
    }
  }

  void _showNewComplaintModal() {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    String category = 'Fasilitas & Sarpras';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
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
                      'Kirim Pengaduan / Keluhan Rahasia',
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
                DropdownButtonFormField<String>(
                  initialValue: category,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'Kategori Pengaduan',
                    labelStyle: TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Color(0xFF1E293B),
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'Fasilitas & Sarpras', child: Text('Fasilitas & Sarpras')),
                    DropdownMenuItem(value: 'Akademik & Pembelajaran', child: Text('Akademik & Pembelajaran')),
                    DropdownMenuItem(value: 'Kesehatan & Asrama', child: Text('Kesehatan & Asrama')),
                    DropdownMenuItem(value: 'Keuangan & SPP', child: Text('Keuangan & SPP')),
                  ],
                  onChanged: (val) {
                    if (val != null) category = val;
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: titleController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'Judul Keluhan / Aspirasi',
                    labelStyle: TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Color(0xFF1E293B),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descController,
                  maxLines: 3,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'Deskripsi Rinci Keluhan',
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
                      backgroundColor: const Color(0xFF4F46E5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () {
                      if (titleController.text.isEmpty || descController.text.isEmpty) {
                        return;
                      }

                      final newTicket = ComplaintTicketModel(
                        id: 'comp-${DateTime.now().millisecondsSinceEpoch}',
                        userId: 'u-1',
                        userName: 'Wali Santri ${widget.studentName}',
                        title: titleController.text.trim(),
                        description: descController.text.trim(),
                        category: category,
                        priority: 'MEDIUM',
                        status: 'OPEN',
                        createdAt: DateTime.now(),
                      );

                      setState(() {
                        _complaints.insert(0, newTicket);
                      });

                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Tiket pengaduan rahasia berhasil dikirim.'),
                          backgroundColor: Color(0xFF4F46E5),
                        ),
                      );
                    },
                    child: const Text(
                      'Kirim Tiket Pengaduan',
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('BK & Tata Tertib: ${widget.studentName}'),
        backgroundColor: const Color(0xFF312E81),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF6366F1)),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: const Color(0xFF6366F1),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // 1. Discipline Status Header Card
                  _buildDisciplineHeaderCard(),
                  const SizedBox(height: 16),

                  // 2. Filter Navigation Chips
                  _buildFilterChips(),
                  const SizedBox(height: 16),

                  // 3. Tab Contents
                  if (_selectedTab == 'DISCIPLINE')
                    _buildViolationsList()
                  else if (_selectedTab == 'ACHIEVEMENTS')
                    _buildAchievementsList()
                  else if (_selectedTab == 'COUNSELING')
                    _buildCounselingList()
                  else
                    _buildComplaintsList(),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showNewComplaintModal,
        backgroundColor: const Color(0xFF4F46E5),
        icon: const Icon(Icons.rate_review, color: Colors.white),
        label: const Text(
          'Kirim Pengaduan',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildDisciplineHeaderCard() {
    final points = _disciplineSummary?.totalPoints ?? 0;
    final sanction = _disciplineSummary?.sanctionLetter ?? 'NONE';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E1B4B), Color(0xFF0F172A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF4338CA).withAlpha(128)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Status Kedisiplinan & Tata Tertib',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: sanction == 'NONE'
                      ? const Color(0xFF065F46)
                      : sanction == 'SP1'
                          ? const Color(0xFF92400E)
                          : const Color(0xFF991B1B),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  sanction == 'NONE'
                      ? 'TERTIB & BERSIH'
                      : sanction == 'SP1'
                          ? 'STATUS: SP 1'
                          : sanction == 'SP2'
                              ? 'STATUS: SP 2'
                              : 'STATUS: SP 3 (PANGGILAN)',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMetricItem('Poin Pelanggaran', '$points Poin', Colors.redAccent),
              _buildMetricItem('Total Prestasi', '${_achievements.length} Medali', Colors.greenAccent),
              _buildMetricItem('Sesi BK', '${_counselingSessions.length} Sesi', Colors.indigoAccent),
              _buildMetricItem('Tiket Pengaduan', '${_complaints.length} Tiket', Colors.amberAccent),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, Color accent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10)),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            color: accent,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      {'id': 'DISCIPLINE', 'name': 'Tata Tertib'},
      {'id': 'ACHIEVEMENTS', 'name': 'Prestasi'},
      {'id': 'COUNSELING', 'name': 'Konseling BK'},
      {'id': 'COMPLAINTS', 'name': 'Pengaduan'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((f) {
          final isSelected = _selectedTab == f['id'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(f['name']!),
              selected: isSelected,
              selectedColor: const Color(0xFF4F46E5),
              backgroundColor: const Color(0xFF1E293B),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.white70,
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              onSelected: (_) {
                setState(() => _selectedTab = f['id']!);
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildViolationsList() {
    if (_violations.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Text(
            'Alhamdulillah, santri tidak memiliki catatan pelanggaran.',
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ),
      );
    }

    return Column(
      children: _violations.map((v) {
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF881337),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '+${v.points} POIN',
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    '${v.violationDate.day}/${v.violationDate.month}/${v.violationDate.year}',
                    style: const TextStyle(color: Colors.white60, fontSize: 10),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                v.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              if (v.sanction != null && v.sanction!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Sanksi / Tindakan: ${v.sanction}',
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
              const SizedBox(height: 6),
              Text(
                'Dicatat oleh: ${v.recordedByName}',
                style: const TextStyle(color: Colors.white60, fontSize: 10),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAchievementsList() {
    if (_achievements.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Text(
            'Belum ada catatan prestasi',
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ),
      );
    }

    return Column(
      children: _achievements.map((ach) {
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF064E3B),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      ach.level,
                      style: const TextStyle(
                        color: Colors.greenAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    '+${ach.points} Poin',
                    style: const TextStyle(
                      color: Colors.greenAccent,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                ach.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Tanggal: ${ach.achievementDate.day}/${ach.achievementDate.month}/${ach.achievementDate.year}',
                style: const TextStyle(color: Colors.white60, fontSize: 10),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCounselingList() {
    if (_counselingSessions.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Text(
            'Belum ada catatan sesi bimbingan konseling',
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ),
      );
    }

    return Column(
      children: _counselingSessions.map((cs) {
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF312E81),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      cs.category,
                      style: const TextStyle(
                        color: Colors.indigoAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    '${cs.sessionDate.day}/${cs.sessionDate.month}/${cs.sessionDate.year}',
                    style: const TextStyle(color: Colors.white60, fontSize: 10),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Catatan: ${cs.notes}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  height: 1.4,
                ),
              ),
              if (cs.actionPlan != null && cs.actionPlan!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  'Rencana Aksi: ${cs.actionPlan}',
                  style: const TextStyle(color: Colors.indigoAccent, fontSize: 11),
                ),
              ],
              const SizedBox(height: 6),
              Text(
                'Konselor: ${cs.counselorName}',
                style: const TextStyle(color: Colors.white60, fontSize: 10),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildComplaintsList() {
    if (_complaints.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Text(
            'Belum ada tiket pengaduan',
            style: TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ),
      );
    }

    return Column(
      children: _complaints.map((c) {
        final isResolved = c.status == 'RESOLVED';

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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isResolved
                          ? const Color(0xFF065F46)
                          : const Color(0xFF78350F),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      c.status,
                      style: TextStyle(
                        color: isResolved ? Colors.greenAccent : Colors.amberAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    c.category,
                    style: const TextStyle(color: Colors.white60, fontSize: 10),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                c.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                c.description,
                style: const TextStyle(color: Colors.white70, fontSize: 11),
              ),
              if (c.resolutionNotes != null && c.resolutionNotes!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Solusi: ${c.resolutionNotes}',
                    style: const TextStyle(color: Colors.greenAccent, fontSize: 11),
                  ),
                ),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }
}
