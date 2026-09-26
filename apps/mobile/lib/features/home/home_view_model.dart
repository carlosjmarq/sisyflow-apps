import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../../core/events.dart';
import '../../core/feedback.dart';
import '../../core/realtime.dart';
import '../../data/models.dart';
import '../../data/recurrence.dart';
import '../../data/repositories.dart';

const _uuid = Uuid();
const _historyLookback = Duration(days: 62);

class HomeViewModel extends ChangeNotifier {
  HomeViewModel({
    required AuthRepository authRepository,
    required ProjectRepository projectRepository,
    required EpicRepository epicRepository,
    required TodoRepository todoRepository,
    required CompletionRepository completionRepository,
    required GamificationRepository gamificationRepository,
    required this.dataChanges,
    required this.realtimeBus,
  }) : _auth = authRepository,
       _projects = projectRepository,
       _epics = epicRepository,
       _todos = todoRepository,
       _completions = completionRepository,
       _gamification = gamificationRepository {
    dataChanges.addListener(_onDataChanged);
    _unsubscribeRealtime = realtimeBus.watchRefresh(const {
      DbTable.projects,
      DbTable.epics,
      DbTable.todos,
      DbTable.todoCompletions,
    }, refresh);
  }

  final DataChangeNotifier dataChanges;
  final RealtimeBus realtimeBus;
  VoidCallback? _unsubscribeRealtime;

  void _onDataChanged() {
    load();
  }

  @override
  void dispose() {
    _unsubscribeRealtime?.call();
    dataChanges.removeListener(_onDataChanged);
    super.dispose();
  }

  final AuthRepository _auth;
  final ProjectRepository _projects;
  final EpicRepository _epics;
  final TodoRepository _todos;
  final CompletionRepository _completions;
  final GamificationRepository _gamification;

  List<Project> projects = [];
  List<Epic> epics = [];
  List<DayTodo> dayTodos = [];
  GamificationData gamification = const GamificationData();
  Map<String, List<TodoCompletion>> completionsByTodo = {};
  bool loading = true;

  Future<void> load() => _load();

  /// Recarga silenciosa (sin spinner) para los eventos de Realtime.
  Future<void> refresh() => _load(showLoading: false);

  Future<void> _load({bool showLoading = true}) async {
    if (showLoading) {
      loading = true;
      notifyListeners();
    }
    try {
      final results = await Future.wait([
        _projects.listWithDetails(),
        _epics.list(),
        _todos.listDayTodos(),
        _gamification.load(),
      ]);
      projects = results[0] as List<Project>;
      epics = results[1] as List<Epic>;
      dayTodos = results[2] as List<DayTodo>;
      gamification = results[3] as GamificationData;
      await _loadCompletions();
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _loadCompletions() async {
    final ids = dayTodos.map((todo) => todo.id).toList();
    if (ids.isEmpty) {
      completionsByTodo = {};
      return;
    }
    final completions = await _completions.listSince(
      ids,
      DateTime.now().subtract(_historyLookback),
    );
    final map = <String, List<TodoCompletion>>{};
    for (final completion in completions) {
      (map[completion.todoId] ??= []).add(completion);
    }
    completionsByTodo = map;
  }

  CompletionState completionStateFor(DayTodo todo) {
    final items = completionsByTodo[todo.id] ?? const <TodoCompletion>[];
    final start = recurrencePeriodStart(todo.recurrence);
    final count = start == null
        ? 0
        : items.where((item) => !item.completedAt.isBefore(start)).length;
    return CompletionState(
      count: count,
      lastAt: items.isEmpty ? null : items.first.completedAt,
      items: items,
    );
  }

  Future<void> completeTodo(DayTodo todo) async {
    final userId = _currentUserId();
    if (userId == null) return;
    final completion = TodoCompletion(
      id: _uuid.v4(),
      todoId: todo.id,
      completedAt: DateTime.now(),
    );
    final previous = Map<String, List<TodoCompletion>>.from(completionsByTodo);
    (completionsByTodo[todo.id] ??= []).insert(0, completion);
    notifyListeners();

    try {
      await _completions.insert(todo.id, userId, completion.completedAt);
      await _reloadGamification();
    } catch (error) {
      completionsByTodo = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> undoLast(DayTodo todo) async {
    final items = completionsByTodo[todo.id];
    if (items == null || items.isEmpty) return;
    final last = items.first;
    final previous = Map<String, List<TodoCompletion>>.from(completionsByTodo);
    completionsByTodo[todo.id] = items.sublist(1);
    notifyListeners();

    try {
      await _completions.delete(last.id);
      await _reloadGamification();
    } catch (error) {
      completionsByTodo = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> _reloadGamification() async {
    try {
      gamification = await _gamification.load();
      notifyListeners();
    } catch (_) {
      // El heatmap se actualiza en el próximo refresh.
    }
  }

  Future<void> createProject(String name, String color, String epicId) async {
    final userId = _currentUserId();
    if (userId == null) return;
    final optimistic = Project(
      id: _uuid.v4(),
      epicId: epicId,
      name: name,
      color: color,
      status: ProjectStatus.active,
      createdAt: DateTime.now(),
    );
    projects = [optimistic, ...projects];
    notifyListeners();
    try {
      await _projects.insert(optimistic, userId);
      await load();
    } catch (error) {
      projects = projects.where((p) => p.id != optimistic.id).toList();
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> updateProject(
    String id, {
    String? name,
    String? color,
    String? epicId,
    ProjectStatus? status,
  }) async {
    final previous = projects;
    projects = projects
        .map(
          (project) => project.id == id
              ? Project(
                  id: project.id,
                  epicId: epicId ?? project.epicId,
                  name: name ?? project.name,
                  color: color ?? project.color,
                  status: status ?? project.status,
                  createdAt: project.createdAt,
                  epic: project.epic,
                  todoCount: project.todoCount,
                  doneCount: project.doneCount,
                )
              : project,
        )
        .toList();
    notifyListeners();
    try {
      await _projects.update(
        id,
        name: name,
        color: color,
        epicId: epicId,
        status: status,
      );
    } catch (error) {
      projects = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> deleteProject(String id) async {
    final previous = projects;
    projects = projects.where((project) => project.id != id).toList();
    notifyListeners();
    try {
      await _projects.delete(id);
    } catch (error) {
      projects = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  String? _currentUserId() {
    final id = _auth.currentUser?.id;
    if (id == null) {
      showMessage('Tu sesión expiró. Volvé a iniciar sesión.', isError: true);
    }
    return id;
  }
}
