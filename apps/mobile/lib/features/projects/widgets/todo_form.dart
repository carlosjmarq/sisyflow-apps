import 'package:flutter/material.dart';

import '../../../data/models.dart';

class TodoForm extends StatefulWidget {
  const TodoForm({super.key, required this.onCreate});

  final void Function(String title, TodoRecurrence recurrence) onCreate;

  @override
  State<TodoForm> createState() => _TodoFormState();
}

class _TodoFormState extends State<TodoForm> {
  final _controller = TextEditingController();
  TodoRecurrence _recurrence = TodoRecurrence.none;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final title = _controller.text.trim();
    if (title.isEmpty) return;
    widget.onCreate(title, _recurrence);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Nueva tarea'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _controller,
            autofocus: true,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              labelText: 'Título',
              border: OutlineInputBorder(),
            ),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<TodoRecurrence>(
            initialValue: _recurrence,
            decoration: const InputDecoration(
              labelText: 'Repetición',
              border: OutlineInputBorder(),
            ),
            items: [
              for (final recurrence in TodoRecurrence.values)
                DropdownMenuItem(
                  value: recurrence,
                  child: Text(recurrence.label),
                ),
            ],
            onChanged: (value) =>
                setState(() => _recurrence = value ?? TodoRecurrence.none),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(onPressed: _submit, child: const Text('Crear')),
      ],
    );
  }
}
