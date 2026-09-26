/// Configuración de entorno inyectada con
/// `flutter run --dart-define-from-file=env.json`.
class Env {
  const Env._();

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const publishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
  );

  static bool get isConfigured =>
      supabaseUrl.isNotEmpty && publishableKey.isNotEmpty;
}
