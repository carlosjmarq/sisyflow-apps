import 'package:flutter/material.dart';

import '../../../data/models.dart';
import '../../../shared/colors.dart';

class EpicStreakChips extends StatelessWidget {
  const EpicStreakChips({
    super.key,
    required this.streaks,
    required this.epics,
    required this.selectedScope,
    required this.onSelect,
    this.loading = false,
  });

  final List<EpicStreak> streaks;
  final List<Epic> epics;
  final String selectedScope;
  final ValueChanged<String> onSelect;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (loading) {
      return const SizedBox(
        height: 40,
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }
    if (epics.isEmpty) {
      return Text(
        'Creá una épica para ver sus rachas.',
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      );
    }
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: epics.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final epic = epics[index];
          final streak = streaks.firstWhere(
            (item) => item.epicId == epic.id,
            orElse: () => const EpicStreak(epicId: '', current: 0, best: 0),
          );
          final selected = selectedScope == epic.id;
          return FilterChip(
            selected: selected,
            onSelected: (_) => onSelect(selected ? 'global' : epic.id),
            avatar: Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: colorFromHex(epic.colorCode),
                shape: BoxShape.circle,
              ),
            ),
            label: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(epic.name),
                const SizedBox(width: 6),
                const Icon(Icons.local_fire_department, size: 16),
                Text('${streak.current}'),
              ],
            ),
          );
        },
      ),
    );
  }
}
