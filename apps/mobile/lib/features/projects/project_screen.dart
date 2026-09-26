import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/events.dart';
import '../../core/realtime.dart';
import '../../data/models.dart';
import '../../data/repositories.dart';
import 'project_view_model.dart';
import 'widgets/tags_manager.dart';
import 'widgets/todo_card.dart';
import 'widgets/todo_form.dart';
import 'widgets/todo_sheet.dart';

class ProjectScreen extends StatelessWidget {
  const ProjectScreen({super.key, required this.projectId, this.openTodoId});

  final String projectId;
  final String? openTodoId;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => ProjectViewModel(
        authRepository: context.read<AuthRepository>(),
        projectRepository: context.read<ProjectRepository>(),
        todoRepository: context.read<TodoRepository>(),
        tagRepository: context.read<TagRepository>(),
        completionRepository: context.read<CompletionRepository>(),
        dataChanges: context.read<DataChangeNotifier>(),
        realtimeBus: context.read<RealtimeBus>(),
        projectId: projectId,
      )..load(),
      child: _ProjectView(openTodoId: openTodoId),
    );
  }
}

class _ProjectView extends StatefulWidget {
  const _ProjectView({this.openTodoId});

  final String? openTodoId;

  @override
  State<_ProjectView> createState() => _ProjectViewState();
}

class _ProjectViewState extends State<_ProjectView> {
  bool _openedInitialTodo = false;

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<ProjectViewModel>();
    final theme = Theme.of(context);
    final project = vm.project;

    if (!vm.loading &&
        !_openedInitialTodo &&
        widget.openTodoId != null &&
        vm.todos.any((todo) => todo.id == widget.openTodoId)) {
      _openedInitialTodo = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final todo = vm.todos.firstWhere(
          (item) => item.id == widget.openTodoId,
        );
        _openTodo(todo);
      });
    }

    final filtered = vm.filteredTodos;
    final pending = filtered
        .where(
          (todo) =>
              todo.status != TodoStatus.done &&
              todo.status != TodoStatus.cancelled,
        )
        .toList();
    final completed = filtered
        .where((todo) => todo.status == TodoStatus.done)
        .toList();
    final cancelled = filtered
        .where((todo) => todo.status == TodoStatus.cancelled)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(project?.name ?? 'Proyecto'),
            Text(
              project == null
                  ? 'Cargando…'
                  : '${project.epic?.name ?? ''} · ${vm.todos.length} tarea${vm.todos.length == 1 ? '' : 's'}',
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Etiquetas del proyecto',
            icon: const Icon(Icons.sell_outlined),
            onPressed: () => _openTags(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Nueva tarea',
        onPressed: () => showDialog<void>(
          context: context,
          builder: (_) => TodoForm(onCreate: vm.createTodo),
        ),
        child: const Icon(Icons.add),
      ),
      body: vm.loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              children: [
                if (project != null && project.status != ProjectStatus.active)
                  Card(
                    color: theme.colorScheme.tertiaryContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        'Proyecto ${project.status.label.toLowerCase()}: sus tareas pendientes no aparecen en «Tareas del día». El historial se conserva.',
                        style: TextStyle(
                          color: theme.colorScheme.onTertiaryContainer,
                        ),
                      ),
                    ),
                  ),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    PopupMenuButton<TodoSortKey>(
                      tooltip: 'Ordenar',
                      onSelected: vm.setSortBy,
                      itemBuilder: (context) => [
                        for (final option in TodoSortKey.values)
                          PopupMenuItem(
                            value: option,
                            child: Text(option.label),
                          ),
                      ],
                      child: Chip(
                        avatar: const Icon(Icons.sort, size: 18),
                        label: Text(vm.sortBy.label),
                      ),
                    ),
                    FilterChip(
                      label: Text(vm.filterStatus?.label ?? 'Estado'),
                      selected: vm.filterStatus != null,
                      onSelected: (_) => _pickStatus(vm),
                    ),
                    FilterChip(
                      label: Text(vm.filterPriority?.label ?? 'Prioridad'),
                      selected: vm.filterPriority != null,
                      onSelected: (_) => _pickPriority(vm),
                    ),
                    if (vm.filterStatus != null || vm.filterPriority != null)
                      TextButton(
                        onPressed: vm.clearFilters,
                        child: const Text('Limpiar'),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                if (vm.todos.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'No hay tareas aún. Creá la primera con el botón +.',
                      ),
                    ),
                  ),
                _Section(
                  label: 'Pendientes',
                  todos: pending,
                  vm: vm,
                  onOpen: _openTodo,
                ),
                _Section(
                  label: 'Completados',
                  todos: completed,
                  vm: vm,
                  onOpen: _openTodo,
                  dimmed: true,
                ),
                _Section(
                  label: 'Cancelados',
                  todos: cancelled,
                  vm: vm,
                  onOpen: _openTodo,
                  dimmed: true,
                ),
              ],
            ),
    );
  }

  void _openTodo(Todo todo) {
    final vm = context.read<ProjectViewModel>();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: vm,
        child: TodoSheet(todo: todo),
      ),
    );
  }

  void _openTags() {
    final vm = context.read<ProjectViewModel>();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) =>
          ChangeNotifierProvider.value(value: vm, child: const TagsManager()),
    );
  }

  void _pickStatus(ProjectViewModel vm) {
    showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Todos los estados'),
              onTap: () {
                vm.setFilterStatus(null);
                Navigator.of(sheetContext).pop();
              },
            ),
            for (final status in TodoStatus.values)
              ListTile(
                title: Text(status.label),
                onTap: () {
                  vm.setFilterStatus(status);
                  Navigator.of(sheetContext).pop();
                },
              ),
          ],
        ),
      ),
    );
  }

  void _pickPriority(ProjectViewModel vm) {
    showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Todas las prioridades'),
              onTap: () {
                vm.setFilterPriority(null);
                Navigator.of(sheetContext).pop();
              },
            ),
            for (final priority in TaskPriority.values)
              ListTile(
                title: Text(priority.label),
                onTap: () {
                  vm.setFilterPriority(priority);
                  Navigator.of(sheetContext).pop();
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.label,
    required this.todos,
    required this.vm,
    required this.onOpen,
    this.dimmed = false,
  });

  final String label;
  final List<Todo> todos;
  final ProjectViewModel vm;
  final ValueChanged<Todo> onOpen;
  final bool dimmed;

  @override
  Widget build(BuildContext context) {
    if (todos.isEmpty) return const SizedBox.shrink();
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 6),
          child: Row(
            children: [
              Text(label, style: theme.textTheme.titleSmall),
              const SizedBox(width: 8),
              Text(
                '${todos.length}',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        Opacity(
          opacity: dimmed ? 0.75 : 1,
          child: Column(
            children: [
              for (final todo in todos)
                TodoCard(
                  todo: todo,
                  completion: vm.completionStateFor(todo),
                  onTap: () => onOpen(todo),
                  onStatusChange: (status) =>
                      vm.updateTodo(todo.id, status: status),
                  onComplete: () => vm.completeTodo(todo),
                  onUndo: () => vm.undoLast(todo),
                  onDelete: () => _confirmDelete(context, todo),
                ),
            ],
          ),
        ),
      ],
    );
  }

  void _confirmDelete(BuildContext context, Todo todo) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Eliminar tarea'),
        content: Text(
          'Se eliminará permanentemente "${todo.title}". Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () {
              vm.deleteTodo(todo.id);
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
  }
}
