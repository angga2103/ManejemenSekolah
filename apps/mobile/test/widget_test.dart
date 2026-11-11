import 'package:flutter_test/flutter_test.dart';
import 'package:edusaas_mobile/main.dart';

void main() {
  testWidgets('Renders EduSaaS Mobile Role Preview Screen', (WidgetTester tester) async {
    await tester.pumpWidget(const EduSaaSApp());

    // Verify app title and role preview title render
    expect(find.text('EduSaaS Mobile'), findsOneWidget);
    expect(find.text('Pratinjau Peran: Attendance Officer'), findsOneWidget);
    expect(find.text('Pindai QR Santri'), findsOneWidget);
  });
}
