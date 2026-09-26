import 'package:flutter/foundation.dart';

import '../../core/events.dart';
import '../../core/feedback.dart';
import '../../data/repositories.dart';

class SettingsViewModel extends ChangeNotifier {
  SettingsViewModel({
    required AuthRepository authRepository,
    required BackupService backupService,
    required this.dataChanges,
  }) : _auth = authRepository,
       _backup = backupService;

  final AuthRepository _auth;
  final BackupService _backup;
  final DataChangeNotifier dataChanges;

  bool busy = false;

  Future<void> exportBackup() async {
    final userId = _auth.currentUser?.id;
    if (userId == null) return;
    busy = true;
    notifyListeners();
    try {
      await _backup.export(userId);
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> importBackup() async {
    final userId = _auth.currentUser?.id;
    if (userId == null) return;
    busy = true;
    notifyListeners();
    try {
      await _backup.import(userId);
      dataChanges.markChanged();
      showMessage('Backup importado.');
    } on FormatException catch (error) {
      showMessage(error.message, isError: true);
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
    } finally {
      busy = false;
      notifyListeners();
    }
  }
}
