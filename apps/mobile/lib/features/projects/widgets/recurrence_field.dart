import 'package:flutter/material.dart';

import '../../../data/models.dart';
import '../../../data/recurrence.dart';

/// Selector de repetición estilo Google Calendar: al elegir «Semanal» se
/// despliegan las casillas de los días (ADR-017). `weekly` es legacy y se
/// muestra como «Semanal».
class RecurrenceField extends StatelessWidget {
  const RecurrenceField({
    super.key,
    required this.recurrence,
    required this.days,
    required this.onChanged,
  });

  final TodoRecurrence recurrence;
  final List<int> days;
  final void Function(TodoRecurrence recurrence, List<int> days) onChanged;

  static const _options = <TodoRecurrence>[
    TodoRecurrence.none,
    TodoRecurrence.daily,
    TodoRecurrence.custom,
    TodoRecurrence.weekdays,
    TodoRecurrence.monthly,
  ];

  static String _label(TodoRecurrence recurrence) => switch (recurrence) {
    TodoRecurrence.custom => 'Semanal',
    TodoRecurrence.weekdays => 'Días hábiles (Lun–Vie)',
    _ => recurrence.label,
  };

  @override
  Widget build(BuildContext context) {
    final selectValue = recurrence == TodoRecurrence.weekly
        ? TodoRecurrence.custom
        : recurrence;
    final effectiveDays = days.isNotEmpty ? days : [isoWeekday(DateTime.now())];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        DropdownButtonFormField<TodoRecurrence>(
          initialValue: selectValue,
          decoration: const InputDecoration(
            labelText: 'Repetición',
            border: OutlineInputBorder(),
          ),
          items: [
            for (final option in _options)
              DropdownMenuItem(value: option, child: Text(_label(option))),
          ],
          onChanged: (value) {
            if (value == null) return;
            if (value == TodoRecurrence.custom) {
              onChanged(TodoRecurrence.custom, effectiveDays);
            } else {
              onChanged(value, const []);
            }
          },
        ),
        if (selectValue == TodoRecurrence.custom) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final weekday in weekdays)
                FilterChip(
                  label: Text(weekday.short),
                  tooltip: weekday.label,
                  selected: effectiveDays.contains(weekday.value),
                  onSelected: (_) => _toggleDay(effectiveDays, weekday.value),
                ),
            ],
          ),
        ],
      ],
    );
  }

  void _toggleDay(List<int> current, int day) {
    final next = current.toSet();
    if (next.contains(day)) {
      if (next.length == 1) return;
      next.remove(day);
    } else {
      next.add(day);
    }
    onChanged(TodoRecurrence.custom, next.toList()..sort());
  }
}
