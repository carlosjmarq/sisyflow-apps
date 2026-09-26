import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/models.dart';
import '../../../data/recurrence.dart';
import '../../../editor/content_editor.dart';
import '../project_view_model.dart';
import 'recurrence_field.dart';

class TodoSheet extends StatefulWidget {
  const TodoSheet({super.key, required this.todo});

  final Todo todo;

  @override
  State<TodoSheet> createState() => _TodoSheetState();
}

class _TodoSheetState extends State<TodoSheet> {
  late final TextEditingController _titleController;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.todo.title);
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<ProjectViewModel>();
    final todo = vm.todos.firstWhere(
      (item) => item.id == widget.todo.id,
      orElse: () => widget.todo,
    );
    final theme = Theme.of(context);
    final completion = vm.completionStateFor(todo);
    final statusOptions = todo.isRecurring
        ? TodoStatus.values
              .where((status) => status != TodoStatus.done)
              .toList()
        : TodoStatus.values;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.92,
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _titleController,
                      textCapitalization: TextCapitalization.sentences,
                      style: theme.textTheme.titleLarge,
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: 'Título de la tarea',
                      ),
                      onSubmitted: (value) {
                        final title = value.trim();
                        if (title.isNotEmpty && title != todo.title) {
                          vm.updateTodo(todo.id, title: title);
                        }
                      },
                    ),
                  ),
                  IconButton(
                    tooltip: 'Guardar título',
                    icon: const Icon(Icons.check),
                    onPressed: () {
                      final title = _titleController.text.trim();
                      if (title.isNotEmpty && title != todo.title) {
                        vm.updateTodo(todo.id, title: title);
                      }
                    },
                  ),
                  IconButton(
                    tooltip: 'Cerrar',
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        _Field(
                          label: 'Estado',
                          child: DropdownButtonFormField<TodoStatus>(
                            initialValue: todo.status,
                            isExpanded: true,
                            items: [
                              for (final status in statusOptions)
                                DropdownMenuItem(
                                  value: status,
                                  child: Text(status.label),
                                ),
                            ],
                            onChanged: (value) {
                              if (value != null) {
                                vm.updateTodo(todo.id, status: value);
                              }
                            },
                          ),
                        ),
                        _Field(
                          label: 'Prioridad',
                          child: DropdownButtonFormField<TaskPriority>(
                            initialValue: todo.priority,
                            isExpanded: true,
                            items: [
                              for (final priority in TaskPriority.values)
                                DropdownMenuItem(
                                  value: priority,
                                  child: Text(priority.label),
                                ),
                            ],
                            onChanged: (value) {
                              if (value != null) {
                                vm.updateTodo(todo.id, priority: value);
                              }
                            },
                          ),
                        ),
                        _Field(
                          label: 'Urgencia',
                          child: DropdownButtonFormField<TaskPriority>(
                            initialValue: todo.urgency,
                            isExpanded: true,
                            items: [
                              for (final urgency in TaskPriority.values)
                                DropdownMenuItem(
                                  value: urgency,
                                  child: Text(urgency.label),
                                ),
                            ],
                            onChanged: (value) {
                              if (value != null) {
                                vm.updateTodo(todo.id, urgency: value);
                              }
                            },
                          ),
                        ),
                        _Field(
                          label: 'Repetición',
                          child: RecurrenceField(
                            recurrence: todo.recurrence,
                            days: todo.recurrenceDays,
                            onChanged: (recurrence, days) =>
                                vm.changeRecurrence(todo, recurrence, days),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(
                          Icons.schedule,
                          size: 18,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            todo.expirationDate == null
                                ? 'Sin fecha de vencimiento'
                                : 'Vence el ${_longDate(todo.expirationDate!)}',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                        TextButton(
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate:
                                  todo.expirationDate ?? DateTime.now(),
                              firstDate: DateTime(2020),
                              lastDate: DateTime(2100),
                            );
                            if (picked != null) {
                              vm.updateTodo(todo.id, expirationDate: picked);
                            }
                          },
                          child: const Text('Elegir'),
                        ),
                        if (todo.expirationDate != null)
                          IconButton(
                            tooltip: 'Quitar vencimiento',
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () =>
                                vm.updateTodo(todo.id, clearExpiration: true),
                          ),
                      ],
                    ),
                    if (vm.tags.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          for (final tag in vm.tags)
                            Chip(
                              label: Text(tag.name),
                              visualDensity: VisualDensity.compact,
                            ),
                        ],
                      ),
                    ],
                    if (todo.isRecurring) ...[
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Text('Historial', style: theme.textTheme.titleSmall),
                          const SizedBox(width: 8),
                          Text(
                            '${completion.count} ${recurrencePeriodLabel(todo.recurrence)}',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (completion.items.isEmpty)
                        Text(
                          'Aún no hay completados registrados.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      for (final item in completion.items.take(12))
                        ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          leading: Icon(
                            Icons.check_circle,
                            size: 18,
                            color: theme.colorScheme.primary,
                          ),
                          title: Text(_dateTime(item.completedAt)),
                          trailing: IconButton(
                            tooltip: 'Eliminar completado',
                            icon: const Icon(Icons.delete_outline, size: 18),
                            onPressed: () => vm.removeCompletion(item.id),
                          ),
                        ),
                    ],
                    const SizedBox(height: 16),
                    Text('Contenido', style: theme.textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Container(
                      height: 320,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: theme.colorScheme.outlineVariant,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: ContentEditor(
                        key: ValueKey(todo.id),
                        content: todo.content,
                        contentFormat: todo.contentFormat,
                        onChanged: (content, format) => vm.updateTodo(
                          todo.id,
                          content: content,
                          contentFormat: format,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () {
                        vm.deleteTodo(todo.id);
                        Navigator.of(context).pop();
                      },
                      icon: const Icon(Icons.delete_outline),
                      label: const Text('Eliminar tarea'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: theme.colorScheme.error,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _longDate(DateTime date) =>
      '${date.day} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][date.month - 1]} de ${date.year}';

  String _dateTime(DateTime date) =>
      '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 4),
          child,
        ],
      ),
    );
  }
}
