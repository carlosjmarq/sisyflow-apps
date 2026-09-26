import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../../core/events.dart';
import '../../core/feedback.dart';
import '../../data/models.dart';
import '../../data/repositories.dart';

const _uuid = Uuid();

class EpicsViewModel extends ChangeNotifier {
  EpicsViewModel({
    required AuthRepository authRepository,
    required EpicRepository epicRepository,
    required this.dataChanges,
  }) : _auth = authRepository,
       _epics = epicRepository;

  final AuthRepository _auth;
  final EpicRepository _epics;
  final DataChangeNotifier dataChanges;

  List<Epic> epics = [];
  bool loading = true;

  Future<void> load() async {
    loading = true;
    notifyListeners();
    try {
      epics = await _epics.list();
    } catch (error) {
      showMessage(friendlyError(error), isError: true);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> create(String name, String colorCode) async {
    final userId = _auth.currentUser?.id;
    if (userId == null) return;
    final epic = Epic(
      id: _uuid.v4(),
      name: name,
      colorCode: colorCode,
      createdAt: DateTime.now(),
    );
    epics = [...epics, epic]..sort((a, b) => a.name.compareTo(b.name));
    notifyListeners();
    try {
      await _epics.insert(epic, userId);
      dataChanges.markChanged();
    } catch (error) {
      epics = epics.where((item) => item.id != epic.id).toList();
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> update(String id, {String? name, String? colorCode}) async {
    final previous = epics;
    epics = epics
        .map(
          (epic) => epic.id == id
              ? Epic(
                  id: epic.id,
                  name: name ?? epic.name,
                  colorCode: colorCode ?? epic.colorCode,
                  createdAt: epic.createdAt,
                )
              : epic,
        )
        .toList();
    notifyListeners();
    try {
      await _epics.update(id, name: name, colorCode: colorCode);
      dataChanges.markChanged();
    } catch (error) {
      epics = previous;
      notifyListeners();
      showMessage(friendlyError(error), isError: true);
    }
  }

  Future<void> delete(String id) async {
    final previous = epics;
    epics = epics.where((epic) => epic.id != id).toList();
    notifyListeners();
    try {
      await _epics.delete(id);
      dataChanges.markChanged();
    } catch (error) {
      epics = previous;
      notifyListeners();
      showMessage(
        'No se puede eliminar la épica: tiene proyectos asignados',
        isError: true,
      );
    }
  }
}
