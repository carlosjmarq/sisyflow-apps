import 'package:flutter/material.dart';

import '../../../data/models.dart';
import '../../../shared/colors.dart';

class ProjectFormResult {
  const ProjectFormResult({
    required this.name,
    required this.color,
    required this.epicId,
    required this.status,
  });

  final String name;
  final String color;
  final String epicId;
  final ProjectStatus status;
}

class ProjectForm extends StatefulWidget {
  const ProjectForm({
    super.key,
    required this.epics,
    required this.onSubmit,
    this.project,
  });

  final List<Epic> epics;
  final Project? project;
  final ValueChanged<ProjectFormResult> onSubmit;

  @override
  State<ProjectForm> createState() => _ProjectFormState();
}

class _ProjectFormState extends State<ProjectForm> {
  late final TextEditingController _nameController;
  late String _color;
  late String _epicId;
  late ProjectStatus _status;

  @override
  void initState() {
    super.initState();
    final project = widget.project;
    _nameController = TextEditingController(text: project?.name ?? '');
    _color = project?.color ?? projectColors.first.hex;
    _epicId =
        project?.epicId ??
        (widget.epics.isNotEmpty ? widget.epics.first.id : '');
    _status = project?.status ?? ProjectStatus.active;
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final editing = widget.project != null;
    return AlertDialog(
      title: Text(editing ? 'Editar proyecto' : 'Nuevo proyecto'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _nameController,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Nombre',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            Text('Color', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (final option in projectColors)
                  InkWell(
                    onTap: () => setState(() => _color = option.hex),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 36,
                      height: 36,
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
            DropdownButtonFormField<String>(
              initialValue: _epicId.isEmpty ? null : _epicId,
              decoration: const InputDecoration(
                labelText: 'Épica',
                border: OutlineInputBorder(),
              ),
              items: [
                for (final epic in widget.epics)
                  DropdownMenuItem(
                    value: epic.id,
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
                        Text(epic.name),
                      ],
                    ),
                  ),
              ],
              onChanged: (value) => setState(() => _epicId = value ?? ''),
            ),
            if (editing) ...[
              const SizedBox(height: 16),
              DropdownButtonFormField<ProjectStatus>(
                initialValue: _status,
                decoration: const InputDecoration(
                  labelText: 'Estado',
                  border: OutlineInputBorder(),
                ),
                items: [
                  for (final status in ProjectStatus.values)
                    DropdownMenuItem(value: status, child: Text(status.label)),
                ],
                onChanged: (value) =>
                    setState(() => _status = value ?? ProjectStatus.active),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () {
            final name = _nameController.text.trim();
            if (name.isEmpty || _epicId.isEmpty) return;
            widget.onSubmit(
              ProjectFormResult(
                name: name,
                color: _color,
                epicId: _epicId,
                status: _status,
              ),
            );
            Navigator.of(context).pop();
          },
          child: Text(editing ? 'Guardar' : 'Crear'),
        ),
      ],
    );
  }
}
