import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/repositories.dart';
import 'search_view_model.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) =>
          SearchViewModel(todoRepository: context.read<TodoRepository>()),
      child: const _SearchView(),
    );
  }
}

class _SearchView extends StatelessWidget {
  const _SearchView();

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<SearchViewModel>();
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Buscar tareas por título',
            border: InputBorder.none,
          ),
          onChanged: vm.onQueryChanged,
        ),
      ),
      body: vm.loading
          ? const Center(child: CircularProgressIndicator())
          : vm.query.trim().length < 2
          ? Center(
              child: Text(
                'Escribí al menos 2 letras.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            )
          : vm.results.isEmpty
          ? Center(
              child: Text(
                'No se encontraron tareas.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: vm.results.length,
              itemBuilder: (context, index) {
                final result = vm.results[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 6),
                  child: ListTile(
                    title: Text(result.todo.title),
                    subtitle: Text(
                      '${result.projectName} · ${result.todo.status.label}',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push(
                      '/project/${result.todo.projectId}',
                      extra: result.todo.id,
                    ),
                  ),
                );
              },
            ),
    );
  }
}
