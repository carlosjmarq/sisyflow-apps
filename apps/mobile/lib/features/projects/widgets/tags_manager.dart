import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/models.dart';
import '../../../shared/colors.dart';
import '../project_view_model.dart';

class TagsManager extends StatefulWidget {
  const TagsManager({super.key});

  @override
  State<TagsManager> createState() => _TagsManagerState();
}

class _TagsManagerState extends State<TagsManager> {
  final _controller = TextEditingController();
  String _color = projectColors.first.hex;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<ProjectViewModel>();
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Etiquetas del proyecto', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: const InputDecoration(
                    labelText: 'Nueva etiqueta',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  onSubmitted: (_) => _add(vm),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: () => _add(vm),
                child: const Text('Agregar'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              for (final option in projectColors)
                InkWell(
                  onTap: () => setState(() => _color = option.hex),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: colorFromHex(option.hex),
                      shape: BoxShape.circle,
                      border: _color == option.hex
                          ? Border.all(
                              color: theme.colorScheme.onSurface,
                              width: 3,
                            )
                          : null,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (vm.tags.isEmpty)
            Text(
              'Aún no hay etiquetas.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          for (final tag in vm.tags)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: tag.color == null
                      ? theme.colorScheme.outline
                      : colorFromHex(tag.color!),
                  shape: BoxShape.circle,
                ),
              ),
              title: Text(tag.name),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    tooltip: 'Editar etiqueta',
                    icon: const Icon(Icons.edit_outlined),
                    onPressed: () => _edit(context, vm, tag),
                  ),
                  IconButton(
                    tooltip: 'Eliminar etiqueta',
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () => vm.deleteTag(tag.id),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _add(ProjectViewModel vm) {
    final name = _controller.text.trim();
    if (name.isEmpty) return;
    vm.createTag(name, _color);
    _controller.clear();
  }

  void _edit(BuildContext context, ProjectViewModel vm, Tag tag) {
    final controller = TextEditingController(text: tag.name);
    var color = tag.color ?? projectColors.first.hex;
    showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setState) => AlertDialog(
          title: const Text('Editar etiqueta'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
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
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final option in projectColors)
                    InkWell(
                      onTap: () => setState(() => color = option.hex),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        width: 28,
                        height: 28,
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
                vm.updateTag(tag.id, name: name, color: color);
                Navigator.of(dialogContext).pop();
              },
              child: const Text('Guardar'),
            ),
          ],
        ),
      ),
    ).whenComplete(controller.dispose);
  }
}
