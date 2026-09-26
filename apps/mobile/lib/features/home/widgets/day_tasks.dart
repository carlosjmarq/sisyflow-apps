import 'package:flutter/material.dart';

import '../../../data/models.dart';
import '../../../data/recurrence.dart';
import '../../../shared/colors.dart';

class DayTasks extends StatelessWidget {
  const DayTasks({
    super.key,
    required this.todos,
    required this.completionStateFor,
    required this.onComplete,
    required this.onUndo,
    required this.onOpen,
  });

  final List<DayTodo> todos;
  final CompletionState Function(DayTodo todo) completionStateFor;
  final ValueChanged<DayTodo> onComplete;
  final ValueChanged<DayTodo> onUndo;
  final ValueChanged<DayTodo> onOpen;

  @override
  Widget build(BuildContext context) {
    if (todos.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Icon(
                Icons.event_available_outlined,
                size: 36,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 8),
              const Text('No hay tareas pendientes en proyectos activos'),
            ],
          ),
        ),
      );
    }

    final groups = <String, List<DayTodo>>{};
    for (final todo in todos) {
      (groups[todo.projectId] ??= []).add(todo);
    }
    final ordered = groups.entries.toList()
      ..sort(
        (a, b) => a.value.first.projectName.toLowerCase().compareTo(
          b.value.first.projectName.toLowerCase(),
        ),
      );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final group in ordered) ...[
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 6),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: colorFromHex(group.value.first.projectColor),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  group.value.first.projectName,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                if (group.value.first.epicName != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    group.value.first.epicName!,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
                const SizedBox(width: 8),
                Text(
                  '${group.value.length}',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ],
            ),
          ),
          for (final todo in group.value)
            _DayTaskRow(
              todo: todo,
              completion: completionStateFor(todo),
              onComplete: () => onComplete(todo),
              onUndo: () => onUndo(todo),
              onOpen: () => onOpen(todo),
            ),
        ],
      ],
    );
  }
}

class _DayTaskRow extends StatelessWidget {
  const _DayTaskRow({
    required this.todo,
    required this.completion,
    required this.onComplete,
    required this.onUndo,
    required this.onOpen,
  });

  final DayTodo todo;
  final CompletionState completion;
  final VoidCallback onComplete;
  final VoidCallback onUndo;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final expired =
        todo.expirationDate != null &&
        todo.expirationDate!.isBefore(DateTime.now());
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              if (todo.isRecurring)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  tooltip: 'Registrar completado',
                  onPressed: onComplete,
                  icon: Icon(
                    completion.count > 0
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color: completion.count > 0
                        ? theme.colorScheme.primary
                        : theme.colorScheme.outline,
                  ),
                )
              else
                Container(
                  width: 10,
                  height: 10,
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Color(priorityColors[todo.priority]!),
                    shape: BoxShape.circle,
                  ),
                ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      todo.title,
                      style: theme.textTheme.bodyLarge,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Wrap(
                      spacing: 8,
                      runSpacing: 2,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          todo.status.label,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        if (todo.isRecurring)
                          Text(
                            recurrenceSummary(
                              todo.recurrence,
                              todo.recurrenceDays,
                            ),
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.tertiary,
                            ),
                          ),
                        if (todo.isRecurring && completion.count > 0)
                          Text(
                            '×${completion.count} ${recurrencePeriodLabel(todo.recurrence)}',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        if (todo.expirationDate != null)
                          Text(
                            'Vence ${_shortDate(todo.expirationDate!)}',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: expired
                                  ? theme.colorScheme.error
                                  : theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              if (todo.isRecurring && completion.count > 0)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  tooltip: 'Deshacer último completado',
                  onPressed: onUndo,
                  icon: const Icon(Icons.undo, size: 18),
                ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}

String _shortDate(DateTime date) =>
    '${date.day} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][date.month - 1]}';
