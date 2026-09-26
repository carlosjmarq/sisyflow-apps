import 'package:flutter/material.dart';

import '../../../data/models.dart';

const _months = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

class Heatmap extends StatelessWidget {
  const Heatmap({
    super.key,
    required this.logs,
    required this.baseColor,
    this.days = 126,
  });

  final List<DailyLog> logs;
  final Color baseColor;
  final int days;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final counts = <DateTime, int>{};
    for (final log in logs) {
      final day = DateTime(log.day.year, log.day.month, log.day.day);
      counts[day] = (counts[day] ?? 0) + log.count;
    }

    final today = DateTime.now();
    final end = DateTime(today.year, today.month, today.day);
    var start = end.subtract(Duration(days: days - 1));
    start = start.subtract(Duration(days: start.weekday - DateTime.monday));

    final columns = <List<DateTime>>[];
    var cursor = start;
    while (!cursor.isAfter(end)) {
      final week = <DateTime>[];
      for (var i = 0; i < 7; i++) {
        week.add(cursor);
        cursor = cursor.add(const Duration(days: 1));
      }
      columns.add(week);
    }

    final maxCount = counts.values.fold<int>(
      0,
      (max, value) => value > max ? value : max,
    );
    final emptyColor = theme.colorScheme.surfaceContainerHighest;

    final labels = <String?>[];
    int? lastMonth;
    for (final column in columns) {
      final month = column.first.month;
      labels.add(month != lastMonth ? _months[month - 1] : null);
      lastMonth = month;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          reverse: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 14,
                child: Row(
                  children: [
                    for (var index = 0; index < columns.length; index++)
                      SizedBox(
                        width: 16,
                        child: labels[index] == null
                            ? null
                            : Text(
                                labels[index]!,
                                style: theme.textTheme.labelSmall,
                              ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final column in columns)
                    Padding(
                      padding: const EdgeInsets.only(right: 3),
                      child: Column(
                        children: [
                          for (final day in column)
                            _HeatCell(
                              day: day,
                              count: day.isAfter(end)
                                  ? null
                                  : (counts[day] ?? 0),
                              maxCount: maxCount,
                              baseColor: baseColor,
                              emptyColor: emptyColor,
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Text('Menos', style: theme.textTheme.labelSmall),
            const SizedBox(width: 6),
            for (var level = 0; level <= 4; level++)
              Container(
                width: 12,
                height: 12,
                margin: const EdgeInsets.only(right: 3),
                decoration: BoxDecoration(
                  color: _levelColor(level, maxCount, baseColor, emptyColor),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            const SizedBox(width: 3),
            Text('Más', style: theme.textTheme.labelSmall),
          ],
        ),
      ],
    );
  }
}

class _HeatCell extends StatelessWidget {
  const _HeatCell({
    required this.day,
    required this.count,
    required this.maxCount,
    required this.baseColor,
    required this.emptyColor,
  });

  final DateTime day;
  final int? count;
  final int maxCount;
  final Color baseColor;
  final Color emptyColor;

  int get _level {
    final value = count;
    if (value == null || value == 0 || maxCount == 0) return 0;
    final ratio = value / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  @override
  Widget build(BuildContext context) {
    final level = _level;
    final label = count == null
        ? ''
        : '${day.day} ${_months[day.month - 1]}: ${count!} completada${count == 1 ? '' : 's'}';
    return Tooltip(
      message: label,
      child: Container(
        width: 13,
        height: 13,
        margin: const EdgeInsets.only(bottom: 3),
        decoration: BoxDecoration(
          color: _levelColor(level, maxCount, baseColor, emptyColor),
          borderRadius: BorderRadius.circular(3),
        ),
      ),
    );
  }
}

Color _levelColor(int level, int maxCount, Color baseColor, Color emptyColor) {
  if (level <= 0) return emptyColor;
  final alpha = switch (level) {
    1 => 0.25,
    2 => 0.45,
    3 => 0.7,
    _ => 1.0,
  };
  return baseColor.withValues(alpha: alpha);
}
