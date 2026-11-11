import 'package:flutter/material.dart';

void main() {
  runApp(const EduSaaSApp());
}

class EduSaaSApp extends StatelessWidget {
  const EduSaaSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduSaaS Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E40AF)),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(
          child: Text('EduSaaS Mobile: Phase 0 Foundation'),
        ),
      ),
    );
  }
}
