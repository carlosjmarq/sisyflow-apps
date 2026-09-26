import 'package:flutter/material.dart';

/// Messenger global para avisos desde ViewModels (sin BuildContext).
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

void showMessage(String message, {bool isError = false}) {
  final messenger = scaffoldMessengerKey.currentState;
  if (messenger == null) return;
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? const Color(0xFF8C1D18) : null,
      ),
    );
}

/// Traduce errores de Supabase/red a mensajes accionables en español.
String friendlyError(Object error) {
  final text = error.toString();
  if (text.contains('SocketException') ||
      text.contains('Failed host lookup') ||
      text.contains('Connection refused') ||
      text.contains('ClientException')) {
    return 'Sin conexión con el servidor. Revisá tu red e intentá de nuevo.';
  }
  if (text.contains('Invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (text.contains('Email not confirmed')) {
    return 'Confirmá tu email antes de iniciar sesión.';
  }
  if (text.contains('User already registered')) {
    return 'Ya existe una cuenta con ese email.';
  }
  if (text.contains('row-level security')) {
    return 'No tenés permiso para hacer ese cambio.';
  }
  return 'Algo salió mal. Intentá de nuevo.';
}
