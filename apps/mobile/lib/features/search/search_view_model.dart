import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../core/feedback.dart';
import '../../core/realtime.dart';
import '../../data/models.dart';
import '../../data/repositories.dart';

class SearchViewModel extends ChangeNotifier {
  SearchViewModel({
    required TodoRepository todoRepository,
    required RealtimeBus realtimeBus,
  }) : _todos = todoRepository {
    _unsubscribeRealtime = realtimeBus.watchRefresh(const {
      DbTable.todos,
    }, _onRealtime);
  }

  final TodoRepository _todos;
  Timer? _debounce;
  VoidCallback? _unsubscribeRealtime;

  void _onRealtime() {
    if (query.trim().length >= 2) _search();
  }

  List<TodoSearchResult> results = [];
  bool loading = false;
  String query = '';

  void onQueryChanged(String value) {
    query = value;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), _search);
    notifyListeners();
  }

  Future<void> _search() async {
    final trimmed = query.trim();
    if (trimmed.length < 2) {
      results = [];
      loading = false;
      notifyListeners();
      return;
    }
    loading = true;
    notifyListeners();
    try {
      results = await _todos.search(trimmed);
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _unsubscribeRealtime?.call();
    super.dispose();
  }
}
