import 'dart:convert';

import 'models.dart';

DateTime? _date(Object? value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}

DateTime _requiredDate(Object? value, DateTime fallback) =>
    _date(value) ?? fallback;

String _string(Object? value, [String fallback = '']) =>
    value == null ? fallback : value.toString();

List<int> _intList(Object? value) {
  if (value is! List) return const [];
  return value.whereType<num>().map((item) => item.toInt()).toList();
}

EpicRef? _epicRef(Object? value) {
  if (value is! Map) return null;
  return EpicRef(
    id: _string(value['id']),
    name: _string(value['name']),
    colorCode: _string(value['color_code'], defaultHex),
  );
}

Epic epicFromRow(Map<String, dynamic> row) => Epic(
  id: _string(row['id']),
  name: _string(row['name']),
  colorCode: _string(row['color_code'], defaultHex),
  createdAt: _requiredDate(row['created_at'], DateTime.now()),
);

Project projectFromRow(Map<String, dynamic> row) {
  final todos = (row['todos'] as List?) ?? const [];
  final doneCount = todos
      .where((todo) => (todo is Map) && todo['status'] == 'done')
      .length;
  return Project(
    id: _string(row['id']),
    epicId: _string(row['epic_id']),
    name: _string(row['name']),
    color: _string(row['color_code'], defaultHex),
    status: ProjectStatus.fromDb(row['status'] as String?),
    createdAt: _requiredDate(row['created_at'], DateTime.now()),
    epic: _epicRef(row['epics']),
    todoCount: todos.length,
    doneCount: doneCount,
  );
}

Todo todoFromRow(Map<String, dynamic> row) => Todo(
  id: _string(row['id']),
  projectId: _string(row['project_id']),
  title: _string(row['title']),
  status: TodoStatus.fromDb(row['status'] as String?),
  priority: TaskPriority.fromDb(row['priority'] as String?),
  urgency: TaskPriority.fromDb(row['urgency'] as String?),
  content: jsonEncode(row['content'] ?? const []),
  contentFormat: row['content_format'] == 'markdown' ? 'markdown' : 'blocknote',
  createdAt: _requiredDate(row['created_at'], DateTime.now()),
  updatedAt: _date(row['updated_at']),
  expirationDate: _date(row['expiration_date']),
  completedAt: _date(row['completed_at']),
  recurrence: TodoRecurrence.fromDb(row['recurrence'] as String?),
  recurrenceDays: _intList(row['recurrence_days']),
);

DayTodo dayTodoFromRow(Map<String, dynamic> row) {
  final todo = todoFromRow(row);
  final project = row['projects'];
  final projectMap = project is Map ? project : const {};
  final epic = projectMap['epics'];
  final epicMap = epic is Map ? epic : const {};
  return DayTodo(
    id: todo.id,
    projectId: todo.projectId,
    title: todo.title,
    status: todo.status,
    priority: todo.priority,
    urgency: todo.urgency,
    content: todo.content,
    contentFormat: todo.contentFormat,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
    expirationDate: todo.expirationDate,
    completedAt: todo.completedAt,
    recurrence: todo.recurrence,
    recurrenceDays: todo.recurrenceDays,
    projectName: _string(projectMap['name'], 'Proyecto'),
    projectColor: _string(projectMap['color_code'], defaultHex),
    epicName: epicMap.isEmpty ? null : _string(epicMap['name']),
  );
}

Tag tagFromRow(Map<String, dynamic> row) => Tag(
  id: _string(row['id']),
  projectId: _string(row['project_id']),
  name: _string(row['name']),
  color: row['color_code'] == null ? null : _string(row['color_code']),
);

TodoCompletion completionFromRow(Map<String, dynamic> row) => TodoCompletion(
  id: _string(row['id']),
  todoId: _string(row['todo_id']),
  completedAt: _requiredDate(row['completed_at'], DateTime.now()),
);

Map<String, dynamic> todoInsert(Todo todo, String userId) => {
  'id': todo.id,
  'user_id': userId,
  'project_id': todo.projectId,
  'title': todo.title,
  'status': todo.status.dbValue,
  'priority': todo.priority.dbValue,
  'urgency': todo.urgency.dbValue,
  'recurrence': todo.recurrence.dbValue,
  'recurrence_days': todo.recurrence == TodoRecurrence.custom
      ? todo.recurrenceDays
      : null,
  'expiration_date': todo.expirationDate?.toIso8601String(),
  'content': contentJson(todo.content),
  'content_format': todo.contentFormat,
  'completed_at': todo.completedAt?.toIso8601String(),
  'created_at': todo.createdAt.toIso8601String(),
  'updated_at': (todo.updatedAt ?? DateTime.now()).toIso8601String(),
};

/// Convierte el `content` del dominio (string JSON de bloques BlockNote) al
/// valor que espera Postgres (`jsonb`). Contenido no-JSON se envuelve en un
/// párrafo de texto, igual que el desktop.
Object contentJson(String content) {
  try {
    final parsed = jsonDecode(content);
    if (parsed is List) return parsed;
    if (parsed is Map) return [parsed];
  } catch (_) {
    // markdown legacy: se conserva como párrafo
  }
  return [
    {
      'type': 'paragraph',
      'content': [
        {'type': 'text', 'text': content, 'styles': <String, dynamic>{}},
      ],
    },
  ];
}
