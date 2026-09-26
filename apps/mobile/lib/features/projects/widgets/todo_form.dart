import 'package:flutter/material.dart';

import '../../../data/models.dart';
import 'recurrence_field.dart';

class TodoForm extends StatefulWidget {
  const TodoForm({super.key, required this.onCreate});

  final void Function(String title, TodoRecurrence recurrence, List<int> days)
  onCreate;

  @override
  State<TodoForm> createState() => _TodoFormState();
}

class _TodoFormState extends State<TodoForm> {
  final _controller = TextEditingController();
  TodoRecurrence _recurrence = TodoRecurrence.none;
  List<int> _recurrenceDays = const [];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final title = _controller.text.trim();
    if (title.isEmpty) return;
    widget.onCreate(title, _recurrence, _recurrenceDays);
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
          RecurrenceField(
            recurrence: _recurrence,
            days: _recurrenceDays,
            onChanged: (recurrence, days) => setState(() {
              _recurrence = recurrence;
              _recurrenceDays = days;
            }),
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
