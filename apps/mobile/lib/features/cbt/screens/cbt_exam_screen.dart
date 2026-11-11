import 'dart:async';
import 'package:flutter/material.dart';
import '../models/cbt_models.dart';
import '../services/cbt_api_service.dart';

class CbtExamScreen extends StatefulWidget {
  final ExamSessionModel session;

  const CbtExamScreen({super.key, required this.session});

  @override
  State<CbtExamScreen> createState() => _CbtExamScreenState();
}

class _CbtExamScreenState extends State<CbtExamScreen> {
  late final CbtApiService _apiService;
  late int _remainingSeconds;
  Timer? _timer;

  int _currentIndex = 0;
  final Map<String, String> _answers = {}; // questionId -> selectedOption
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _apiService = CbtApiService();
    _remainingSeconds = widget.session.remainingSeconds;
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        timer.cancel();
        _onTimeOut();
      }
    });
  }

  void _onTimeOut() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Waktu pengerjaan telah habis! Mengumpulkan otomatis...'),
        backgroundColor: Colors.red,
      ),
    );
    _finishExam();
  }

  String _formatTimer(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  void _onSelectOption(String questionId, String optionId) {
    setState(() {
      _answers[questionId] = optionId;
    });

    // Autosave to backend in background
    _apiService.submitAnswer(
      widget.session.id,
      questionId,
      selectedOption: optionId,
    ).catchError((_) {
      // Background retry or silent error handling
    });
  }

  Future<void> _finishExam() async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      final result = await _apiService.finishExamSession(widget.session.id);
      if (mounted) {
        _showResultDialog(result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  void _showResultDialog(ExamResultModel result) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            result.isPassed ? '🎉 Selamat! Anda Lulus' : 'ℹ️ Ujian Selesai',
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Nilai Akhir: ${result.percentage.toStringAsFixed(1)}',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: result.isPassed ? const Color(0xFF059669) : Colors.red,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Benar: ${result.correctAnswersCount} dari ${result.totalQuestions} Soal',
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  '✓ Nilai otomatis tersimpan ke buku rapor digital.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF334155)),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1E3A8A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Kembali ke Menu', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final questions = widget.session.questions;

    if (questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.session.examTitle)),
        body: const Center(child: Text('Tidak ada butir soal dalam paket ujian ini.')),
      );
    }

    final currentQuestion = questions[_currentIndex];
    final selectedOption = _answers[currentQuestion.id];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          widget.session.examTitle,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0.5,
        actions: [
          // Timer Widget
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _remainingSeconds < 300
                  ? const Color(0xFFFEE2E2)
                  : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: _remainingSeconds < 300
                    ? Colors.red
                    : const Color(0xFF3B82F6),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.timer_outlined,
                  size: 16,
                  color: _remainingSeconds < 300 ? Colors.red : const Color(0xFF1E40AF),
                ),
                const SizedBox(width: 4),
                Text(
                  _formatTimer(_remainingSeconds),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    color: _remainingSeconds < 300 ? Colors.red : const Color(0xFF1E40AF),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: _isSubmitting
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Question Palette (Horizontal Bar)
                Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  color: Colors.white,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: questions.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 6),
                    itemBuilder: (context, idx) {
                      final isAnswered = _answers.containsKey(questions[idx].id);
                      final isCurrent = idx == _currentIndex;

                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _currentIndex = idx;
                          });
                        },
                        child: Container(
                          width: 36,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isCurrent
                                ? const Color(0xFF1E3A8A)
                                : isAnswered
                                    ? const Color(0xFF059669)
                                    : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${idx + 1}',
                            style: TextStyle(
                              color: isCurrent || isAnswered
                                  ? Colors.white
                                  : const Color(0xFF475569),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const Divider(height: 1),

                // Question Body
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16.0),
                    children: [
                      // Question Number & Weight
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Soal Nomor ${_currentIndex + 1} dari ${questions.length}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Bobot: ${currentQuestion.scoreWeight.toStringAsFixed(1)} Poin',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      // Question Text Box
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Text(
                          currentQuestion.questionText,
                          style: const TextStyle(
                            fontSize: 14,
                            height: 1.5,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Options
                      ...currentQuestion.options.map((opt) {
                        final isSelected = selectedOption == opt.id;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFFEFF6FF)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF2563EB)
                                  : const Color(0xFFE2E8F0),
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: InkWell(
                            onTap: () => _onSelectOption(currentQuestion.id, opt.id),
                            borderRadius: BorderRadius.circular(10),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  Container(
                                    width: 26,
                                    height: 26,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? const Color(0xFF2563EB)
                                          : const Color(0xFFF1F5F9),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      opt.id,
                                      style: TextStyle(
                                        color: isSelected ? Colors.white : const Color(0xFF475569),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      opt.text,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),

                // Bottom Navigation Buttons
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ElevatedButton(
                        onPressed: _currentIndex > 0
                            ? () {
                                setState(() {
                                  _currentIndex--;
                                });
                              }
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF1F5F9),
                          foregroundColor: const Color(0xFF334155),
                          elevation: 0,
                        ),
                        child: const Text('Sebelumnya'),
                      ),
                      if (_currentIndex < questions.length - 1)
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _currentIndex++;
                            });
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1E3A8A),
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Selanjutnya'),
                        )
                      else
                        ElevatedButton(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Konfirmasi Pengumpulan'),
                                content: Text(
                                  'Anda telah menjawab ${_answers.length} dari ${questions.length} butir soal.\nYakin ingin menyelesaikan ujian sekarang?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.of(ctx).pop(),
                                    child: const Text('Periksa Lagi'),
                                  ),
                                  ElevatedButton(
                                    onPressed: () {
                                      Navigator.of(ctx).pop();
                                      _finishExam();
                                    },
                                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669)),
                                    child: const Text('Ya, Kumpulkan', style: TextStyle(color: Colors.white)),
                                  ),
                                ],
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Kumpulkan Ujian'),
                        ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
