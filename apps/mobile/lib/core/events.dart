import 'package:flutter/foundation.dart';

/// Notifica cambios de datos entre pantallas (Inicio se recarga al volver).
class DataChangeNotifier extends ChangeNotifier {
  void markChanged() => notifyListeners();
}
