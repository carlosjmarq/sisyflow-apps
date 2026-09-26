import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Tablas del dominio replicadas en `supabase_realtime` (ADR-016).
enum DbTable {
  epics('epics'),
  projects('projects'),
  todos('todos'),
  tags('tags'),
  todoCompletions('todo_completions');

  const DbTable(this.value);
  final String value;
}

enum DbChangeType { insert, update, delete }

class DbChange {
  const DbChange({
    required this.table,
    required this.type,
    this.record,
    this.oldRecord,
    this.resync = false,
  });

  final DbTable table;
  final DbChangeType type;
  final Map<String, dynamic>? record;
  final Map<String, dynamic>? oldRecord;

  /// true cuando el bus se (re)suscribe y las vistas deben reconciliar.
  final bool resync;
}

typedef DbChangeHandler = void Function(DbChange change);

/// Bus de Realtime con micro-suscripciones ref-counteadas: un único canal por
/// usuario que solo mantiene los bindings (tabla) que alguna vista necesita.
/// Filtra SIEMPRE por `user_id` porque la RLS no aplica a los DELETE
/// (ver ADR-016).
class RealtimeBus {
  RealtimeBus({SupabaseClient? client})
    : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;
  RealtimeChannel? _channel;
  String? _userId;
  final Map<DbTable, int> _refs = {};
  final Map<DbTable, Set<DbChangeHandler>> _handlers = {};
  Timer? _rebuildTimer;

  void start(String userId) {
    if (_userId == userId && _channel != null) return;
    _teardown();
    _userId = userId;
    _scheduleRebuild(Duration.zero);
  }

  void stop() {
    _userId = null;
    _refs.clear();
    _handlers.clear();
    _rebuildTimer?.cancel();
    _rebuildTimer = null;
    _teardown();
  }

  /// Registra un handler para las tablas indicadas. Devuelve la función para
  /// darse de baja.
  VoidCallback watch(Set<DbTable> tables, DbChangeHandler handler) {
    for (final table in tables) {
      _refs[table] = (_refs[table] ?? 0) + 1;
      (_handlers[table] ??= <DbChangeHandler>{}).add(handler);
    }
    _scheduleRebuild();

    var active = true;
    return () {
      if (!active) return;
      active = false;
      for (final table in tables) {
        final next = (_refs[table] ?? 1) - 1;
        if (next <= 0) {
          _refs.remove(table);
        } else {
          _refs[table] = next;
        }
        _handlers[table]?.remove(handler);
      }
      _scheduleRebuild();
    };
  }

  /// Igual que [watch] pero coalesce las ráfagas llamando a [refresh].
  VoidCallback watchRefresh(
    Set<DbTable> tables,
    VoidCallback refresh, {
    bool enabled = true,
    Duration debounce = const Duration(milliseconds: 250),
  }) {
    if (!enabled) return () {};
    Timer? timer;
    final unsubscribe = watch(tables, (_) {
      timer?.cancel();
      timer = Timer(debounce, refresh);
    });
    return () {
      timer?.cancel();
      unsubscribe();
    };
  }

  void _scheduleRebuild([Duration delay = const Duration(milliseconds: 50)]) {
    _rebuildTimer?.cancel();
    _rebuildTimer = Timer(delay, _rebuild);
  }

  void _rebuild() {
    _teardown();
    final userId = _userId;
    if (userId == null || _refs.isEmpty) return;

    var channel = _client.channel('sisyflow:db:$userId');
    for (final table in _refs.keys) {
      channel = channel.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: table.value,
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: userId,
        ),
        callback: (payload) => _dispatch(table, payload),
      );
    }
    channel.subscribe((status, _) {
      if (status == RealtimeSubscribeStatus.subscribed) _resync();
    });
    _channel = channel;
  }

  void _dispatch(DbTable table, PostgresChangePayload payload) {
    final DbChangeType? type = switch (payload.eventType) {
      PostgresChangeEvent.insert => DbChangeType.insert,
      PostgresChangeEvent.update => DbChangeType.update,
      PostgresChangeEvent.delete => DbChangeType.delete,
      _ => null,
    };
    if (type == null) return;
    final change = DbChange(
      table: table,
      type: type,
      record: payload.newRecord.isEmpty ? null : payload.newRecord,
      oldRecord: payload.oldRecord.isEmpty ? null : payload.oldRecord,
    );
    for (final handler in _handlers[table] ?? const <DbChangeHandler>{}) {
      handler(change);
    }
  }

  void _resync() {
    for (final entry in _handlers.entries) {
      for (final handler in entry.value) {
        handler(
          DbChange(table: entry.key, type: DbChangeType.update, resync: true),
        );
      }
    }
  }

  void _teardown() {
    final channel = _channel;
    if (channel != null) {
      _client.removeChannel(channel);
      _channel = null;
    }
  }
}
