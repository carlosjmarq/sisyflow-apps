import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/events.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repositories.dart';
import '../../shared/colors.dart';
import 'home_view_model.dart';
import 'widgets/day_tasks.dart';
import 'widgets/epic_streak_chips.dart';
import 'widgets/heatmap.dart';
import 'widgets/project_card.dart';
import 'widgets/project_form.dart';
import 'widgets/streak_hero.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => HomeViewModel(
        authRepository: context.read<AuthRepository>(),
        projectRepository: context.read<ProjectRepository>(),
        epicRepository: context.read<EpicRepository>(),
        todoRepository: context.read<TodoRepository>(),
        completionRepository: context.read<CompletionRepository>(),
        gamificationRepository: context.read<GamificationRepository>(),
        dataChanges: context.read<DataChangeNotifier>(),
      )..load(),
      child: const _HomeView(),
    );
  }
}

class _HomeView extends StatefulWidget {
  const _HomeView();

  @override
  State<_HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<_HomeView> {
  String _scope = 'global';
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<HomeViewModel>();
    final theme = Theme.of(context);
    final selectedEpic = vm.epics
        .where((epic) => epic.id == _scope)
        .firstOrNull;
    final logs = _scope == 'global'
        ? vm.gamification.logs
        : vm.gamification.logs.where((log) => log.epicId == _scope).toList();
    final epicStreak = selectedEpic == null
        ? null
        : vm.gamification.streaks
              .where((item) => item.epicId == selectedEpic.id)
              .firstOrNull;
    final streakCurrent =
        epicStreak?.current ?? vm.gamification.globalStreak.current;
    final streakBest = epicStreak?.best ?? vm.gamification.globalStreak.best;
    final projectsByEpic = <String, List<Project>>{};
    for (final project in vm.projects) {
      (projectsByEpic[project.epicId] ??= []).add(project);
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Inicio'),
            Text(
              _todayLabel(),
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Buscar tareas',
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/search'),
          ),
          IconButton(
            tooltip: 'Tema',
            icon: Icon(
              theme.brightness == Brightness.dark
                  ? Icons.light_mode
                  : Icons.dark_mode,
            ),
            onPressed: () {
              final themeVm = context.read<ThemeViewModel>();
              themeVm.setMode(
                theme.brightness == Brightness.dark
                    ? AppThemeMode.light
                    : AppThemeMode.dark,
              );
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: vm.epics.isEmpty
            ? null
            : () => _openProjectForm(context, vm),
        icon: const Icon(Icons.add),
        label: const Text('Proyecto'),
      ),
      body: RefreshIndicator(
        onRefresh: vm.load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            StreakHero(
              scopeLabel: selectedEpic?.name ?? 'Global',
              current: streakCurrent,
              best: streakBest,
              epics: vm.epics,
              scope: _scope,
              scopeColor: selectedEpic == null
                  ? null
                  : colorFromHex(selectedEpic.colorCode),
              onScopeChanged: (scope) => setState(() => _scope = scope),
              loading: vm.loading,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Mapa de calor',
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => setState(() => _expanded = !_expanded),
                  icon: Icon(_expanded ? Icons.expand_less : Icons.expand_more),
                  label: Text(_expanded ? 'Ver menos' : 'Ver año'),
                ),
              ],
            ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Heatmap(
                  logs: logs,
                  baseColor: selectedEpic == null
                      ? theme.colorScheme.primary
                      : colorFromHex(selectedEpic.colorCode),
                  days: _expanded ? 365 : 126,
                ),
              ),
            ),
            const SizedBox(height: 16),
            EpicStreakChips(
              streaks: vm.gamification.streaks,
              epics: vm.epics,
              selectedScope: _scope,
              onSelect: (scope) => setState(() => _scope = scope),
              loading: vm.loading,
            ),
            const SizedBox(height: 20),
            Text('Tareas del día', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            if (vm.loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              )
            else
              DayTasks(
                todos: vm.dayTodos,
                completionStateFor: vm.completionStateFor,
                onComplete: vm.completeTodo,
                onUndo: vm.undoLast,
                onOpen: (todo) =>
                    context.push('/project/${todo.projectId}', extra: todo.id),
              ),
            const SizedBox(height: 20),
            Text('Proyectos', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            if (!vm.loading && vm.projects.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(
                        Icons.folder_open,
                        size: 36,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(height: 8),
                      const Text('No hay proyectos aún'),
                    ],
                  ),
                ),
              ),
            for (final epic in vm.epics)
              if (projectsByEpic[epic.id]?.isNotEmpty ?? false) ...[
                Padding(
                  padding: const EdgeInsets.only(top: 8, bottom: 6),
                  child: Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: colorFromHex(epic.colorCode),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(epic.name, style: theme.textTheme.titleSmall),
                    ],
                  ),
                ),
                for (final project in projectsByEpic[epic.id]!)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ProjectCard(
                      project: project,
                      onTap: () => context.push('/project/${project.id}'),
                      onEdit: () => _openProjectForm(context, vm, project),
                      onDelete: () => _confirmDelete(context, vm, project),
                    ),
                  ),
              ],
          ],
        ),
      ),
    );
  }

  void _openProjectForm(
    BuildContext context,
    HomeViewModel vm, [
    Project? project,
  ]) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => ProjectForm(
        epics: vm.epics,
        project: project,
        onSubmit: (result) {
          if (project == null) {
            vm.createProject(result.name, result.color, result.epicId);
          } else {
            vm.updateProject(
              project.id,
              name: result.name,
              color: result.color,
              epicId: result.epicId,
              status: result.status,
            );
          }
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context, HomeViewModel vm, Project project) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Eliminar proyecto'),
        content: Text(
          'Se eliminará "${project.name}" y todas sus tareas. Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () {
              vm.deleteProject(project.id);
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
  }

  String _todayLabel() {
    final formatted = DateTime.now().toLocal();
    const weekdays = [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ];
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    return '${weekdays[formatted.weekday - 1]}, ${formatted.day} de ${months[formatted.month - 1]}';
  }
}
