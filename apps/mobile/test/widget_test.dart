import 'package:flutter_test/flutter_test.dart';
import 'package:edusaas_mobile/main.dart';

void main() {
  testWidgets('Renders Phase 0 placeholder successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const EduSaaSApp());
    expect(find.text('EduSaaS Mobile: Phase 0 Foundation'), findsOneWidget);
  });
}
