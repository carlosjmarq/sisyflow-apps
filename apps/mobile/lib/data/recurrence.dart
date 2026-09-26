import 'models.dart';

class WeekdayOption {
  const WeekdayOption(this.value, this.short, this.label);

  final int value;
  final String short;
  final String label;
}

/// Días ISO: 1 = lunes … 7 = domingo (ADR-017).
const weekdays = <WeekdayOption>[
  WeekdayOption(1, 'L', 'Lunes'),
  WeekdayOption(2, 'M', 'Martes'),
  WeekdayOption(3, 'X', 'Miércoles'),
  WeekdayOption(4, 'J', 'Jueves'),
  WeekdayOption(5, 'V', 'Viernes'),
  WeekdayOption(6, 'S', 'Sábado'),
  WeekdayOption(7, 'D', 'Domingo'),
];

/// Día ISO del calendario: 1 = lunes … 7 = domingo (coincide con `DateTime.weekday`).
int isoWeekday(DateTime date) => date.weekday;

/// Inicio del período vigente en la zona horaria local del dispositivo:
/// día a las 00:00, semana el lunes y mes el día 1 (ADR-014). La recurrencia
/// personalizada (`custom`) se comporta como `weekdays`: período de un día.
DateTime? recurrencePeriodStart(TodoRecurrence recurrence, [DateTime? now]) {
  final current = now ?? DateTime.now();
  switch (recurrence) {
    case TodoRecurrence.daily:
    case TodoRecurrence.weekdays:
    case TodoRecurrence.custom:
      return DateTime(current.year, current.month, current.day);
    case TodoRecurrence.weekly:
      final day = DateTime(current.year, current.month, current.day);
      return day.subtract(Duration(days: (day.weekday - DateTime.monday) % 7));
    case TodoRecurrence.monthly:
      return DateTime(current.year, current.month);
    case TodoRecurrence.none:
      return null;
  }
}

String recurrencePeriodLabel(TodoRecurrence recurrence) => switch (recurrence) {
  TodoRecurrence.daily ||
  TodoRecurrence.weekdays ||
  TodoRecurrence.custom => 'hoy',
  TodoRecurrence.weekly => 'esta semana',
  TodoRecurrence.monthly => 'este mes',
  TodoRecurrence.none => '',
};

/// ¿La tarea recurrente "toca" ese día? `custom` solo en sus días y `weekdays`
/// de lunes a viernes; el resto no filtra (ADR-017).
bool recurrenceDueOn(
  TodoRecurrence recurrence,
  List<int> days, [
  DateTime? now,
]) {
  final date = now ?? DateTime.now();
  switch (recurrence) {
    case TodoRecurrence.weekdays:
      return isoWeekday(date) <= 5;
    case TodoRecurrence.custom:
      return days.contains(isoWeekday(date));
    default:
      return true;
  }
}

const _weekdayShort = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

/// Etiqueta legible: para `custom` incluye los días (ej. "Semanal (lun, mar)").
String recurrenceSummary(
  TodoRecurrence recurrence, [
  List<int> days = const [],
]) {
  if (recurrence == TodoRecurrence.custom) {
    final list = days.toSet().toList()..sort();
    if (list.isEmpty) return recurrence.label;
    return 'Semanal (${list.map((day) => _weekdayShort[day - 1]).join(', ')})';
  }
  return recurrence.label;
}
