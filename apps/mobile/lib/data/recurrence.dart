import 'models.dart';

/// Inicio del período vigente en la zona horaria local del dispositivo:
/// día a las 00:00, semana el lunes y mes el día 1 (ADR-014).
DateTime? recurrencePeriodStart(TodoRecurrence recurrence, [DateTime? now]) {
  final current = now ?? DateTime.now();
  switch (recurrence) {
    case TodoRecurrence.daily:
    case TodoRecurrence.weekdays:
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
  TodoRecurrence.daily || TodoRecurrence.weekdays => 'hoy',
  TodoRecurrence.weekly => 'esta semana',
  TodoRecurrence.monthly => 'este mes',
  TodoRecurrence.none => '',
};
