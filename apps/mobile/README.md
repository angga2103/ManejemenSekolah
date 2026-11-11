# Mobile Application (Flutter)

Offline-First mobile application for students, parents, teachers, and security officers in the **Integrated School & Pesantren Management SaaS** platform.

## Architecture
- **Framework**: Flutter (Android & iOS)
- **Local Persistence**: SQLite with Drift reactive ORM
- **Offline Sync Protocol**: Write-ahead queue, automatic backoff sync, cryptographically signed dynamic QR verification
- **Secure Key Storage**: `flutter_secure_storage`
- **State Management**: BLoC / Cubit architecture
