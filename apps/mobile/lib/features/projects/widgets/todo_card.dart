import 'package:flutter/material.dart';

import '../../../data/models.dart';
import '../../../data/recurrence.dart';

class TodoCard extends StatelessWidget {
  const TodoCard({
    super.key,
    required this.todo,
    required this.completion,
    required this.onTap,
    required this.onStatusChange,
    required this.onComplete,
    required this.onUndo,
    required this.onDelete,
  });

  final Todo todo;
  final CompletionState completion;
  final VoidCallback onTap;
  final ValueChanged<TodoStatus> onStatusChange;
  final VoidCallback onComplete;
  final VoidCallback onUndo;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDone = todo.status == TodoStatus.done;
    final isCancelled = todo.status == TodoStatus.cancelled;
    final checked = todo.isRecurring ? completion.count > 0 : isDone;
    final expired =
        todo.expirationDate != null &&
        todo.expirationDate!.isBefore(DateTime.now()) &&
        !isDone;

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 4, 8),
          child: Row(
            children: [
              IconButton(
                tooltip: todo.isRecurring
                    ? 'Registrar completado'
                    : (isDone
                          ? 'Marcar como pendiente'
                          : 'Marcar como completada'),
                onPressed: () {
                  if (todo.isRecurring) {
                    onComplete();
                  } else {
                    onStatusChange(isDone ? TodoStatus.todo : TodoStatus.done);
                  }
                },
                icon: Icon(
                  checked ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: checked
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outline,
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      todo.title,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        decoration: isDone || isCancelled
                            ? TextDecoration.lineThrough
                            : null,
                        color: isDone || isCancelled
                            ? theme.colorScheme.onSurfaceVariant
                            : null,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
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
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.repeat,
                                size: 14,
                                color: theme.colorScheme.tertiary,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                todo.recurrence.label,
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: theme.colorScheme.tertiary,
                                ),
                              ),
                            ],
                          ),
                        if (todo.isRecurring && completion.count > 0)
                          Text(
                            '×${completion.count} ${recurrencePeriodLabel(todo.recurrence)}',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: Color(priorityColors[todo.priority]!),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              todo.priority.label,
                              style: theme.textTheme.labelSmall,
                            ),
                          ],
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
                  tooltip: 'Deshacer último completado',
                  visualDensity: VisualDensity.compact,
                  onPressed: onUndo,
                  icon: const Icon(Icons.undo, size: 18),
                ),
              IconButton(
                tooltip: 'Eliminar tarea',
                visualDensity: VisualDensity.compact,
                onPressed: onDelete,
                icon: Icon(
                  Icons.delete_outline,
                  size: 20,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _shortDate(DateTime date) =>
    '${date.day} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][date.month - 1]}';
