import 'package:flutter_test/flutter_test.dart';
import 'package:sisyflow_mobile/data/models.dart';
import 'package:sisyflow_mobile/data/recurrence.dart';

void main() {
  group('recurrencePeriodStart', () {
    test('diaria inicia a las 00:00 del día local', () {
      final now = DateTime(2030, 1, 15, 18, 30);
      expect(
        recurrencePeriodStart(TodoRecurrence.daily, now),
        DateTime(2030, 1, 15),
      );
      expect(
        recurrencePeriodStart(TodoRecurrence.weekdays, now),
        DateTime(2030, 1, 15),
      );
    });

    test('semanal inicia el lunes', () {
      final wednesday = DateTime(2030, 1, 16, 10);
      expect(
        recurrencePeriodStart(TodoRecurrence.weekly, wednesday),
        DateTime(2030, 1, 14),
      );
      final sunday = DateTime(2030, 1, 20, 10);
      expect(
        recurrencePeriodStart(TodoRecurrence.weekly, sunday),
        DateTime(2030, 1, 14),
      );
    });

    test('mensual inicia el día 1', () {
      expect(
        recurrencePeriodStart(
          TodoRecurrence.monthly,
          DateTime(2030, 1, 31, 23),
        ),
        DateTime(2030, 1, 1),
      );
    });

    test('sin recurrencia no hay período', () {
      expect(recurrencePeriodStart(TodoRecurrence.none), isNull);
    });
  });

  test('etiquetas de período', () {
    expect(recurrencePeriodLabel(TodoRecurrence.daily), 'hoy');
    expect(recurrencePeriodLabel(TodoRecurrence.weekdays), 'hoy');
    expect(recurrencePeriodLabel(TodoRecurrence.weekly), 'esta semana');
    expect(recurrencePeriodLabel(TodoRecurrence.monthly), 'este mes');
  });
}
