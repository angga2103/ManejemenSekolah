abstract class ISyncService {
  Future<void> enqueueOperation({
    required String operationType,
    required Map<String, dynamic> payload,
  });

  Future<int> getPendingOperationsCount();

  Future<void> flushQueue();
}

enum SyncItemStatus {
  pending,
  syncing,
  completed,
  failed,
}

class SyncOperationItem {
  final String id;
  final String operationType;
  final Map<String, dynamic> payload;
  final int eventTimestamp;
  final SyncItemStatus status;
  final int retryCount;

  SyncOperationItem({
    required this.id,
    required this.operationType,
    required this.payload,
    required this.eventTimestamp,
    this.status = SyncItemStatus.pending,
    this.retryCount = 0,
  });
}
