import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/feedback.dart';
import '../../core/realtime.dart';
import '../../data/repositories.dart';

class AuthViewModel extends ChangeNotifier {
  AuthViewModel(this._repository, {RealtimeBus? realtimeBus})
    : _realtime = realtimeBus ?? RealtimeBus() {
    _syncRealtime();
    _subscription = _repository.authStateChanges.listen((_) {
      _syncRealtime();
      notifyListeners();
    });
  }

  final AuthRepository _repository;
  final RealtimeBus _realtime;
  late final StreamSubscription<AuthState> _subscription;

  /// Bus de Realtime compartido (se provee en el árbol de widgets).
  RealtimeBus get realtimeBus => _realtime;

  void _syncRealtime() {
    final userId = _repository.currentUser?.id;
    if (userId != null) {
      _realtime.start(userId);
    } else {
      _realtime.stop();
    }
  }

  bool _loading = false;

  bool get isAuthenticated => _repository.currentUser != null;
  User? get user => _repository.currentUser;
  bool get loading => _loading;

  Future<bool> signIn(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      await _repository.signIn(email.trim(), password);
      return true;
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> signUp(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final needsConfirmation = await _repository.signUp(
        email.trim(),
        password,
      );
      if (needsConfirmation) {
        showMessage('Te enviamos un email para confirmar tu cuenta.');
      }
      return true;
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> resendConfirmation(String email) async {
    try {
      await _repository.resendConfirmation(email.trim());
      showMessage('Reenviamos el email de confirmación.');
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> signOut() async {
    try {
      await _repository.signOut();
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
    }
  }

  @override
  void dispose() {
    _subscription.cancel();
    _realtime.stop();
    super.dispose();
  }
}
