import 'package:flutter/material.dart';

import '../../../data/models.dart';
import '../../../shared/colors.dart';

class StreakHero extends StatelessWidget {
  const StreakHero({
    super.key,
    required this.scopeLabel,
    required this.current,
    required this.best,
    required this.epics,
    required this.scope,
    required this.onScopeChanged,
    this.scopeColor,
    this.loading = false,
  });

  final String scopeLabel;
  final int current;
  final int best;
  final List<Epic> epics;
  final String scope;
  final ValueChanged<String> onScopeChanged;
  final Color? scopeColor;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.local_fire_department,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Racha actual · $scopeLabel',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
                MenuAnchor(
                  builder: (context, controller, child) => IconButton(
                    onPressed: () => controller.isOpen
                        ? controller.close()
                        : controller.open(),
                    icon: const Icon(Icons.filter_list),
                    color: theme.colorScheme.onPrimaryContainer,
                    tooltip: 'Filtrar por épica',
                  ),
                  menuChildren: [
                    MenuItemButton(
                      onPressed: () => onScopeChanged('global'),
                      leadingIcon: const Icon(Icons.public, size: 18),
                      child: const Text('Vista global'),
                    ),
                    for (final epic in epics)
                      MenuItemButton(
                        onPressed: () => onScopeChanged(epic.id),
                        leadingIcon: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: colorFromHex(epic.colorCode),
                            shape: BoxShape.circle,
                          ),
                        ),
                        child: Text(epic.name),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  loading ? '—' : '$current',
                  style: theme.textTheme.displayMedium?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 8),
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    'días',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  Icons.emoji_events_outlined,
                  size: 18,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
                const SizedBox(width: 6),
                Text(
                  'Mejor marca: ${loading ? '—' : best} días',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
