import 'package:flutter/material.dart';

class OfflineStatusBar extends StatelessWidget {
  final bool isOnline;
  final int pendingSyncCount;

  const OfflineStatusBar({
    super.key,
    required this.isOnline,
    this.pendingSyncCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (isOnline && pendingSyncCount == 0) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      color: isOnline ? Colors.amber[700] : const Color(0xFFE11D48),
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isOnline ? Icons.sync : Icons.cloud_off,
            color: Colors.white,
            size: 14,
          ),
          const SizedBox(width: 8),
          Text(
            !isOnline
              ? 'Mode Offline ($pendingSyncCount antrean tersimpan)'
              : 'Menyinkronkan $pendingSyncCount data ke server...',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
