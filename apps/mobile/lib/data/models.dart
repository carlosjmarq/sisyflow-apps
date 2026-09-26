/// Modelos de dominio de SisyFlow móvil (espejo del desktop, ADR-015).
library;

enum ProjectStatus {
  active('active', 'Activo'),
  paused('paused', 'Pausado'),
  completed('completed', 'Completado');

  const ProjectStatus(this.dbValue, this.label);
  final String dbValue;
  final String label;

  static ProjectStatus fromDb(String? value) => ProjectStatus.values.firstWhere(
    (status) => status.dbValue == value,
    orElse: () => active,
  );
}

enum TodoStatus {
  backlog('backlog', 'Backlog'),
  todo('todo', 'Por hacer'),
  inProgress('in-progress', 'En progreso'),
  done('done', 'Completado'),
  cancelled('cancelled', 'Cancelado');

  const TodoStatus(this.dbValue, this.label);
  final String dbValue;
  final String label;

  static TodoStatus fromDb(String? value) => TodoStatus.values.firstWhere(
    (status) => status.dbValue == value,
    orElse: () => todo,
  );
}

enum TaskPriority {
  low('low', 'Baja'),
  medium('medium', 'Media'),
  high('high', 'Alta'),
  critical('critical', 'Crítica');

  const TaskPriority(this.dbValue, this.label);
  final String dbValue;
  final String label;

  static TaskPriority fromDb(String? value) => TaskPriority.values.firstWhere(
    (priority) => priority.dbValue == value,
    orElse: () => medium,
  );
}

enum TodoRecurrence {
  none('none', 'Nunca'),
  daily('daily', 'Diaria'),
  weekdays('weekdays', 'Días hábiles'),
  weekly('weekly', 'Semanal'),
  monthly('monthly', 'Mensual'),
  custom('custom', 'Personalizada');

  const TodoRecurrence(this.dbValue, this.label);
  final String dbValue;
  final String label;

  static TodoRecurrence fromDb(String? value) =>
      TodoRecurrence.values.firstWhere(
        (recurrence) => recurrence.dbValue == value,
        orElse: () => none,
      );

  bool get isRecurring => this != TodoRecurrence.none;
}

class ProjectColorOption {
  const ProjectColorOption(this.name, this.hex);
  final String name;
  final String hex;
}

const projectColors = <ProjectColorOption>[
  ProjectColorOption('Violeta', '#6750A4'),
  ProjectColorOption('Azul', '#1E88E5'),
  ProjectColorOption('Teal', '#00897B'),
  ProjectColorOption('Verde', '#43A047'),
  ProjectColorOption('Ámbar', '#FFB300'),
  ProjectColorOption('Naranja', '#FB8C00'),
  ProjectColorOption('Rojo', '#E53935'),
  ProjectColorOption('Rosa', '#D81B60'),
  ProjectColorOption('Púrpura', '#8E24AA'),
  ProjectColorOption('Grafito', '#546E7A'),
];

const defaultHex = '#6750A4';

const priorityColors = <TaskPriority, int>{
  TaskPriority.low: 0xFF81C995,
  TaskPriority.medium: 0xFFFDD663,
  TaskPriority.high: 0xFFFCAD70,
  TaskPriority.critical: 0xFFF28B82,
};

class EpicRef {
  const EpicRef({
    required this.id,
    required this.name,
    required this.colorCode,
  });

  final String id;
  final String name;
  final String colorCode;
}

class Epic {
  const Epic({
    required this.id,
    required this.name,
    required this.colorCode,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String colorCode;
  final DateTime createdAt;
}

class Project {
  const Project({
    required this.id,
    required this.epicId,
    required this.name,
    required this.color,
    required this.status,
    required this.createdAt,
    this.epic,
    this.todoCount = 0,
    this.doneCount = 0,
  });

  final String id;
  final String epicId;
  final String name;
  final String color;
  final ProjectStatus status;
  final DateTime createdAt;
  final EpicRef? epic;
  final int todoCount;
  final int doneCount;
}

class Todo {
  const Todo({
    required this.id,
    required this.projectId,
    required this.title,
    required this.status,
    required this.priority,
    required this.urgency,
    required this.content,
    required this.createdAt,
    this.contentFormat = 'blocknote',
    this.updatedAt,
    this.expirationDate,
    this.completedAt,
    this.recurrence = TodoRecurrence.none,
    this.recurrenceDays = const [],
  });

  final String id;
  final String projectId;
  final String title;
  final TodoStatus status;
  final TaskPriority priority;
  final TaskPriority urgency;
  final String content;
  final String contentFormat;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? expirationDate;
  final DateTime? completedAt;
  final TodoRecurrence recurrence;

  /// Días ISO (1 = lunes … 7 = domingo) cuando `recurrence == custom` (ADR-017).
  final List<int> recurrenceDays;

  bool get isRecurring => recurrence.isRecurring;
}

class DayTodo extends Todo {
  const DayTodo({
    required super.id,
    required super.projectId,
    required super.title,
    required super.status,
    required super.priority,
    required super.urgency,
    required super.content,
    required super.createdAt,
    super.contentFormat,
    super.updatedAt,
    super.expirationDate,
    super.completedAt,
    super.recurrence,
    super.recurrenceDays,
    required this.projectName,
    required this.projectColor,
    this.epicName,
  });

  final String projectName;
  final String projectColor;
  final String? epicName;
}

class Tag {
  const Tag({
    required this.id,
    required this.projectId,
    required this.name,
    this.color,
  });

  final String id;
  final String projectId;
  final String name;
  final String? color;
}

class TodoCompletion {
  const TodoCompletion({
    required this.id,
    required this.todoId,
    required this.completedAt,
  });

  final String id;
  final String todoId;
  final DateTime completedAt;
}

class CompletionState {
  const CompletionState({
    required this.count,
    required this.lastAt,
    required this.items,
  });

  final int count;
  final DateTime? lastAt;
  final List<TodoCompletion> items;
}

class TodoSearchResult {
  const TodoSearchResult({required this.todo, required this.projectName});

  final Todo todo;
  final String projectName;
}

class EpicStreak {
  const EpicStreak({
    required this.epicId,
    required this.current,
    required this.best,
  });

  final String epicId;
  final int current;
  final int best;
}

class GlobalStreak {
  const GlobalStreak({required this.current, required this.best});

  final int current;
  final int best;
}

class DailyLog {
  const DailyLog({
    required this.day,
    required this.epicId,
    required this.count,
  });

  final DateTime day;
  final String epicId;
  final int count;
}

class GamificationData {
  const GamificationData({
    this.logs = const [],
    this.streaks = const [],
    this.globalStreak = const GlobalStreak(current: 0, best: 0),
  });

  final List<DailyLog> logs;
  final List<EpicStreak> streaks;
  final GlobalStreak globalStreak;
}
