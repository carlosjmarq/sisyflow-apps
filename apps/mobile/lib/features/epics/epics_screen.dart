import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/events.dart';
import '../../data/models.dart';
import '../../data/repositories.dart';
import '../../shared/colors.dart';
import 'epics_view_model.dart';

class EpicsScreen extends StatelessWidget {
  const EpicsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => EpicsViewModel(
        authRepository: context.read<AuthRepository>(),
        epicRepository: context.read<EpicRepository>(),
        dataChanges: context.read<DataChangeNotifier>(),
      )..load(),
      child: const _EpicsView(),
    );
  }
}

class _EpicsView extends StatelessWidget {
  const _EpicsView();

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<EpicsViewModel>();
    return Scaffold(
      appBar: AppBar(title: const Text('Épicas')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(context, vm),
        icon: const Icon(Icons.add),
        label: const Text('Épica'),
      ),
      body: RefreshIndicator(
        onRefresh: vm.load,
        child: vm.loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                children: [
                  if (vm.epics.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'Las épicas son tus áreas de vida continuas (Salud, Carrera, Inglés…). Creá la primera.',
                        ),
                      ),
                    ),
                  for (final epic in vm.epics)
                    Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: Container(
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            color: colorFromHex(epic.colorCode),
                            shape: BoxShape.circle,
                          ),
                        ),
                        title: Text(epic.name),
                        trailing: PopupMenuButton<String>(
                          onSelected: (value) {
                            if (value == 'edit') {
                              _openForm(context, vm, epic);
                            } else {
                              vm.delete(epic.id);
                            }
                          },
                          itemBuilder: (context) => const [
                            PopupMenuItem(value: 'edit', child: Text('Editar')),
                            PopupMenuItem(
                              value: 'delete',
                              child: Text('Eliminar'),
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

  void _openForm(BuildContext context, EpicsViewModel vm, [Epic? epic]) {
    final controller = TextEditingController(text: epic?.name ?? '');
    var color = epic?.colorCode ?? projectColors.first.hex;
    showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setState) => AlertDialog(
          title: Text(epic == null ? 'Nueva épica' : 'Editar épica'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: controller,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Nombre',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (final option in projectColors)
                    InkWell(
                      onTap: () => setState(() => color = option.hex),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: colorFromHex(option.hex),
                          shape: BoxShape.circle,
                          border: color == option.hex
                              ? Border.all(
                                  color: Theme.of(dialogContext)
                                      .colorScheme
                                      .onSurface,
                                  width: 3,
                                )
                              : null,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () {
                final name = controller.text.trim();
                if (name.isEmpty) return;
                if (epic == null) {
                  vm.create(name, color);
                } else {
                  vm.update(epic.id, name: name, colorCode: color);
                }
                Navigator.of(dialogContext).pop();
              },
              child: Text(epic == null ? 'Crear' : 'Guardar'),
            ),
          ],
        ),
      ),
    ).whenComplete(controller.dispose);
  }
}
