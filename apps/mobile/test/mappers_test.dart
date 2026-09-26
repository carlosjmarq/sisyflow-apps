import 'package:flutter_test/flutter_test.dart';
import 'package:sisyflow_mobile/data/mappers.dart';
import 'package:sisyflow_mobile/data/models.dart';

void main() {
  test('todoFromRow mapea enums y recurrencia', () {
    final todo = todoFromRow({
      'id': 't1',
      'project_id': 'p1',
      'title': 'Ver clase',
      'status': 'in-progress',
      'priority': 'high',
      'urgency': 'low',
      'content': [
        {'type': 'paragraph', 'content': <Map<String, dynamic>>[]},
      ],
      'content_format': 'blocknote',
      'created_at': '2030-01-15T12:00:00Z',
      'updated_at': '2030-01-15T13:00:00Z',
      'expiration_date': null,
      'completed_at': null,
      'recurrence': 'weekdays',
    });
    expect(todo.status, TodoStatus.inProgress);
    expect(todo.priority, TaskPriority.high);
    expect(todo.urgency, TaskPriority.low);
    expect(todo.recurrence, TodoRecurrence.weekdays);
    expect(todo.isRecurring, isTrue);
    expect(todo.content, contains('paragraph'));
  });

  test('projectFromRow calcula conteos y épica embebida', () {
    final project = projectFromRow({
      'id': 'p1',
      'epic_id': 'e1',
      'name': 'Portfolio',
      'color_code': '#6750A4',
      'status': 'paused',
      'created_at': '2030-01-01T00:00:00Z',
      'epics': {'id': 'e1', 'name': 'Carrera', 'color_code': '#1E88E5'},
      'todos': [
        {'status': 'done'},
        {'status': 'todo'},
        {'status': 'done'},
      ],
    });
    expect(project.status, ProjectStatus.paused);
    expect(project.todoCount, 3);
    expect(project.doneCount, 2);
    expect(project.epic?.name, 'Carrera');
  });

  test('dayTodoFromRow embebe proyecto y épica', () {
    final todo = dayTodoFromRow({
      'id': 't1',
      'project_id': 'p1',
      'title': 'Correr',
      'status': 'todo',
      'priority': 'medium',
      'urgency': 'medium',
      'content': const [],
      'created_at': '2030-01-01T00:00:00Z',
      'recurrence': 'daily',
      'projects': {
        'name': 'Entrenar',
        'color_code': '#43A047',
        'epics': {'name': 'Salud'},
      },
    });
    expect(todo.projectName, 'Entrenar');
    expect(todo.epicName, 'Salud');
    expect(todo.recurrence, TodoRecurrence.daily);
  });
}
