import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Violeta de SisyFlow (mismo seed que los tokens MD3 del desktop).
const seedColor = Color(0xFF6750A4);

enum AppThemeMode { system, light, dark }

const themeModeLabels = <AppThemeMode, String>{
  AppThemeMode.system: 'Sistema',
  AppThemeMode.light: 'Claro',
  AppThemeMode.dark: 'Oscuro',
};

class ThemeViewModel extends ChangeNotifier {
  static const _prefsKey = 'sisyflow.theme';

  AppThemeMode _mode = AppThemeMode.system;

  AppThemeMode get mode => _mode;

  ThemeMode get themeMode => switch (_mode) {
    AppThemeMode.system => ThemeMode.system,
    AppThemeMode.light => ThemeMode.light,
    AppThemeMode.dark => ThemeMode.dark,
  };

  ThemeViewModel() {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    _mode = AppThemeMode.values.firstWhere(
      (mode) => mode.name == raw,
      orElse: () => AppThemeMode.system,
    );
    notifyListeners();
  }

  Future<void> setMode(AppThemeMode mode) async {
    _mode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, mode.name);
  }
}

ThemeData buildAppTheme(Brightness brightness) {
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: seedColor,
      brightness: brightness,
    ),
    useMaterial3: true,
  );
}
