import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../../core/events.dart';
import '../../core/feedback.dart';
import '../../core/realtime.dart';
import '../../data/mappers.dart';
import '../../data/models.dart';
import '../../data/recurrence.dart';
import '../../data/repositories.dart';

const _uuid = Uuid();
const _historyLookback = Duration(days: 62);

enum TodoSortKey {
  createdAt('Fecha de creación'),
  updatedAt('Última modificación'),
  priority('Prioridad'),
  status('Estado'),
  title('Alfabético'),
  expirationDate('Fecha de expiración');

  const TodoSortKey(this.label);
  final String label;
}

class ProjectViewModel extends ChangeNotifier {
  ProjectViewModel({
    required AuthRepository authRepository,
    required ProjectRepository projectRepository,
    required TodoRepository todoRepository,
    required TagRepository tagRepository,
    required CompletionRepository completionRepository,
    required this.dataChanges,
    required this.realtimeBus,
    required this.projectId,
  }) : _auth = authRepository,
       _projects = projectRepository,
       _todos = todoRepository,
       _tags = tagRepository,
       _completions = completionRepository {
    _unsubscribeRealtime = realtimeBus.watchRefresh(const {
      DbTable.projects,
      DbTable.todos,
      DbTable.tags,
      DbTable.todoCompletions,
    }, refresh);
  }

  final AuthRepository _auth;
  final ProjectRepository _projects;
  final TodoRepository _todos;
  final TagRepository _tags;
  final CompletionRepository _completions;
  final DataChangeNotifier dataChanges;
  final RealtimeBus realtimeBus;
  final String projectId;
  VoidCallback? _unsubscribeRealtime;

  Project? project;
  List<Todo> todos = [];
  List<Tag> tags = [];
  Map<String, List<TodoCompletion>> completionsByTodo = {};
  bool loading = true;
  TodoSortKey sortBy = TodoSortKey.createdAt;
  TodoStatus? filterStatus;
  TaskPriority? filterPriority;

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
        _projects.getById(projectId),
        _todos.listByProject(projectId),
        _tags.listByProject(projectId),
      ]);
      project = results[0] as Project?;
      todos = results[1] as List<Todo>;
      tags = results[2] as List<Tag>;
      await _loadCompletions();
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _loadCompletions() async {
    final ids = todos.map((todo) => todo.id).toList();
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

  List<Todo> get filteredTodos {
    final filtered = todos.where((todo) {
      if (filterStatus != null && todo.status != filterStatus) return false;
      if (filterPriority != null && todo.priority != filterPriority) {
        return false;
      }
      return true;
    }).toList();
    filtered.sort((a, b) {
      switch (sortBy) {
        case TodoSortKey.priority:
          return b.priority.index.compareTo(a.priority.index);
        case TodoSortKey.status:
          return a.status.index.compareTo(b.status.index);
        case TodoSortKey.title:
          return a.title.toLowerCase().compareTo(b.title.toLowerCase());
        case TodoSortKey.expirationDate:
          final aDate =
              a.expirationDate?.millisecondsSinceEpoch ??
              DateTime.now()
                  .add(const Duration(days: 36500))
                  .millisecondsSinceEpoch;
          final bDate =
              b.expirationDate?.millisecondsSinceEpoch ??
              DateTime.now()
                  .add(const Duration(days: 36500))
                  .millisecondsSinceEpoch;
          return aDate.compareTo(bDate);
        case TodoSortKey.updatedAt:
          final aDate = a.updatedAt?.millisecondsSinceEpoch ?? 0;
          final bDate = b.updatedAt?.millisecondsSinceEpoch ?? 0;
          return bDate.compareTo(aDate);
        case TodoSortKey.createdAt:
          return b.createdAt.compareTo(a.createdAt);
      }
    });
    return filtered;
  }

  void setSortBy(TodoSortKey value) {
    sortBy = value;
    notifyListeners();
  }

  void setFilterStatus(TodoStatus? value) {
    filterStatus = value;
    notifyListeners();
  }

  void setFilterPriority(TaskPriority? value) {
    filterPriority = value;
    notifyListeners();
  }

  void clearFilters() {
    filterStatus = null;
    filterPriority = null;
    notifyListeners();
  }

  CompletionState completionStateFor(Todo todo) {
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

  Future<void> createTodo(String title, TodoRecurrence recurrence) async {
    final userId = _auth.currentUser?.id;
    if (userId == null) return;
    final now = DateTime.now();
    final todo = Todo(
      id: _uuid.v4(),
      projectId: projectId,
      title: title,
      status: TodoStatus.todo,
      priority: TaskPriority.medium,
      urgency: TaskPriority.medium,
      content: '[]',
      createdAt: now,
      updatedAt: now,
      recurrence: recurrence,
    );
    todos = [todo, ...todos];
    notifyListeners();
    try {
      await _todos.insert(todo, userId);
      dataChanges.markChanged();
    } catch (error) {
      todos = todos.where((item) => item.id != todo.id).toList();
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> updateTodo(
    String id, {
    String? title,
    TodoStatus? status,
    TaskPriority? priority,
    TaskPriority? urgency,
    DateTime? expirationDate,
    bool clearExpiration = false,
    String? content,
    String? contentFormat,
    TodoRecurrence? recurrence,
  }) async {
    final index = todos.indexWhere((todo) => todo.id == id);
    if (index < 0) return;
    final previous = todos;
    final current = todos[index];
    final now = DateTime.now();
    final updated = Todo(
      id: current.id,
      projectId: current.projectId,
      title: title ?? current.title,
      status: status ?? current.status,
      priority: priority ?? current.priority,
      urgency: urgency ?? current.urgency,
      content: content ?? current.content,
      contentFormat: contentFormat ?? current.contentFormat,
      createdAt: current.createdAt,
      updatedAt: now,
      expirationDate: clearExpiration
          ? null
          : (expirationDate ?? current.expirationDate),
      completedAt: status == null
          ? current.completedAt
          : status == TodoStatus.done
          ? (current.completedAt ?? now)
          : null,
      recurrence: recurrence ?? current.recurrence,
    );
    todos = [...todos]..[index] = updated;
    notifyListeners();

    final fields = <String, dynamic>{
      'title': ?title,
      'status': ?status?.dbValue,
      'priority': ?priority?.dbValue,
      'urgency': ?urgency?.dbValue,
      if (clearExpiration)
        'expiration_date': null
      else
        'expiration_date': ?expirationDate?.toIso8601String(),
      'content': ?(content == null ? null : contentJson(content)),
      'content_format': ?contentFormat,
      'recurrence': ?recurrence?.dbValue,
    };

    try {
      await _todos.update(id, fields);
      dataChanges.markChanged();
    } catch (error) {
      todos = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> deleteTodo(String id) async {
    final previous = todos;
    todos = todos.where((todo) => todo.id != id).toList();
    notifyListeners();
    try {
      await _todos.delete(id);
      dataChanges.markChanged();
    } catch (error) {
      todos = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> completeTodo(Todo todo) async {
    final userId = _auth.currentUser?.id;
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
      dataChanges.markChanged();
    } catch (error) {
      completionsByTodo = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> undoLast(Todo todo) async {
    final items = completionsByTodo[todo.id];
    if (items == null || items.isEmpty) return;
    final last = items.first;
    final previous = Map<String, List<TodoCompletion>>.from(completionsByTodo);
    completionsByTodo[todo.id] = items.sublist(1);
    notifyListeners();
    try {
      await _completions.delete(last.id);
      dataChanges.markChanged();
    } catch (error) {
      completionsByTodo = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> removeCompletion(String completionId) async {
    final previous = Map<String, List<TodoCompletion>>.from(completionsByTodo);
    for (final entry in completionsByTodo.entries) {
      if (entry.value.any((item) => item.id == completionId)) {
        completionsByTodo[entry.key] = entry.value
            .where((item) => item.id != completionId)
            .toList();
        break;
      }
    }
    notifyListeners();
    try {
      await _completions.delete(completionId);
      dataChanges.markChanged();
    } catch (error) {
      completionsByTodo = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  /// Cambia la recurrencia; si la tarea estaba completada, conserva su
  /// `completedAt` como primer completado y vuelve a pendiente (ADR-014).
  Future<void> changeRecurrence(Todo todo, TodoRecurrence recurrence) async {
    if (todo.recurrence == recurrence) return;
    final userId = _auth.currentUser?.id;
    final wasDone = todo.status == TodoStatus.done;
    final oldCompletedAt = todo.completedAt;

    await updateTodo(todo.id, recurrence: recurrence);

    if (recurrence.isRecurring &&
        wasDone &&
        oldCompletedAt != null &&
        userId != null) {
      try {
        await _completions.insert(todo.id, userId, oldCompletedAt);
        completionsByTodo[todo.id] = [
          TodoCompletion(
            id: _uuid.v4(),
            todoId: todo.id,
            completedAt: oldCompletedAt,
          ),
          ...(completionsByTodo[todo.id] ?? const []),
        ];
        await updateTodo(todo.id, status: TodoStatus.todo);
      } catch (error) {
        showMessage(friendlyError(error), isError: true);
      }
    }
  }

  Future<void> createTag(String name, String? color) async {
    final userId = _auth.currentUser?.id;
    if (userId == null || name.trim().isEmpty) return;
    final tag = Tag(
      id: _uuid.v4(),
      projectId: projectId,
      name: name.trim(),
      color: color,
    );
    tags = [...tags, tag]..sort((a, b) => a.name.compareTo(b.name));
    notifyListeners();
    try {
      await _tags.insert(tag, userId);
    } catch (error) {
      tags = tags.where((item) => item.id != tag.id).toList();
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> updateTag(String id, {String? name, String? color}) async {
    final previous = tags;
    tags = tags
        .map(
          (tag) => tag.id == id
              ? Tag(
                  id: tag.id,
                  projectId: tag.projectId,
                  name: name ?? tag.name,
                  color: color ?? tag.color,
                )
              : tag,
        )
        .toList();
    notifyListeners();
    try {
      await _tags.update(id, name: name, color: color);
    } catch (error) {
      tags = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> deleteTag(String id) async {
    final previous = tags;
    tags = tags.where((tag) => tag.id != id).toList();
    notifyListeners();
    try {
      await _tags.delete(id);
    } catch (error) {
      tags = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  @override
  void dispose() {
    _unsubscribeRealtime?.call();
    super.dispose();
  }
}
