import 'dart:async';
import '../models/attendance_model.dart';

/// Manages client-side offline write queue for attendance scans
/// Persists records in memory/storage until network connectivity is restored
class OfflineAttendanceQueue {
  static final OfflineAttendanceQueue _instance = OfflineAttendanceQueue._internal();
  factory OfflineAttendanceQueue() => _instance;
  OfflineAttendanceQueue._internal();

  final List<OfflineScanItem> _queue = [];
  final StreamController<int> _queueCountController = StreamController<int>.broadcast();

  Stream<int> get queueCountStream => _queueCountController.stream;

  int get pendingCount => _queue.length;

  List<OfflineScanItem> get queue => List.unmodifiable(_queue);

  void enqueue(OfflineScanItem item) {
    _queue.add(item);
    _queueCountController.add(_queue.length);
  }

  void removeByIds(List<String> clientRecordIds) {
    _queue.removeWhere((item) => clientRecordIds.contains(item.clientRecordId));
    _queueCountController.add(_queue.length);
  }

  void clear() {
    _queue.clear();
    _queueCountController.add(0);
  }
}
