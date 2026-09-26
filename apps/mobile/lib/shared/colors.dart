import 'package:flutter/material.dart';

import '../data/models.dart';

Color colorFromHex(String value) {
  final hex = value.replaceFirst('#', '');
  final parsed = int.tryParse(hex, radix: 16);
  if (parsed == null) return colorFromHex(defaultHex);
  return Color(0xFF000000 | parsed);
}

/// Color de una épica por id (con fallback al primario del tema).
Color epicColorFor(String? epicId, List<Epic> epics, Color fallback) {
  if (epicId == null) return fallback;
  for (final epic in epics) {
    if (epic.id == epicId) return colorFromHex(epic.colorCode);
  }
  return fallback;
}
