import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import 'mappers.dart';
import 'models.dart';

const _uuid = Uuid();

SupabaseClient get _client => Supabase.instance.client;

class AuthRepository {
  static const redirectUrl = 'sisyflow://auth/callback';

  User? get currentUser => _client.auth.currentUser;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<void> signIn(String email, String password) async {
    await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<bool> signUp(String email, String password) async {
    final response = await _client.auth.signUp(
      email: email,
      password: password,
      emailRedirectTo: redirectUrl,
    );
    // Con confirmación por email, `session` es null hasta confirmar.
    return response.session == null;
  }

  Future<void> resendConfirmation(String email) async {
    await _client.auth.resend(
      type: OtpType.signup,
      email: email,
      emailRedirectTo: redirectUrl,
    );
  }

  Future<void> signOut() => _client.auth.signOut();
}

class EpicRepository {
  Future<List<Epic>> list() async {
    final rows = await _client.from('epics').select().order('name');
    return rows.map((row) => epicFromRow(row)).toList();
  }

  Future<void> insert(Epic epic, String userId) async {
    await _client.from('epics').insert({
      'id': epic.id,
      'user_id': userId,
      'name': epic.name,
      'color_code': epic.colorCode,
      'created_at': epic.createdAt.toIso8601String(),
    });
  }

  Future<void> update(String id, {String? name, String? colorCode}) async {
    await _client
        .from('epics')
        .update({'name': ?name, 'color_code': ?colorCode})
        .eq('id', id);
  }

  Future<void> delete(String id) async {
    await _client.from('epics').delete().eq('id', id);
  }
}

class ProjectRepository {
  Future<List<Project>> listWithDetails() async {
    final rows = await _client
        .from('projects')
        .select('*, epics(id, name, color_code), todos(status)')
        .order('created_at', ascending: false);
    return rows.map((row) => projectFromRow(row)).toList();
  }

  Future<Project?> getById(String id) async {
    final row = await _client
        .from('projects')
        .select('*, epics(id, name, color_code), todos(status)')
        .eq('id', id)
        .maybeSingle();
    return row == null ? null : projectFromRow(row);
  }

  Future<void> insert(Project project, String userId) async {
    await _client.from('projects').insert({
      'id': project.id,
      'user_id': userId,
      'epic_id': project.epicId,
      'name': project.name,
      'color_code': project.color,
      'status': project.status.dbValue,
      'created_at': project.createdAt.toIso8601String(),
    });
  }

  Future<void> update(
    String id, {
    String? name,
    String? color,
    String? epicId,
    ProjectStatus? status,
  }) async {
    await _client
        .from('projects')
        .update({
          'name': ?name,
          'color_code': ?color,
          'epic_id': ?epicId,
          'status': ?status?.dbValue,
        })
        .eq('id', id);
  }

  Future<void> delete(String id) async {
    await _client.from('projects').delete().eq('id', id);
  }
}

class TodoRepository {
  Future<List<Todo>> listByProject(String projectId) async {
    final rows = await _client
        .from('todos')
        .select()
        .eq('project_id', projectId);
    return rows.map((row) => todoFromRow(row)).toList();
  }

  Future<List<DayTodo>> listDayTodos() async {
    final rows = await _client
        .from('todos')
        .select('*, projects!inner(name, color_code, epics(name))')
        .not('status', 'in', '(done,cancelled)')
        .eq('projects.status', 'active');
    return rows.map((row) => dayTodoFromRow(row)).toList();
  }

  Future<List<TodoSearchResult>> search(String query) async {
    final rows = await _client
        .from('todos')
        .select('*, projects(name)')
        .ilike('title', '%$query%')
        .limit(30);
    return rows.map((row) {
      final project = row['projects'];
      final name = project is Map ? project['name']?.toString() ?? '' : '';
      return TodoSearchResult(todo: todoFromRow(row), projectName: name);
    }).toList();
  }

  Future<void> insert(Todo todo, String userId) async {
    await _client.from('todos').insert(todoInsert(todo, userId));
  }

  Future<void> update(String id, Map<String, dynamic> fields) async {
    await _client
        .from('todos')
        .update({...fields, 'updated_at': DateTime.now().toIso8601String()})
        .eq('id', id);
  }

  Future<void> delete(String id) async {
    await _client.from('todos').delete().eq('id', id);
  }
}

class TagRepository {
  Future<List<Tag>> listByProject(String projectId) async {
    final rows = await _client
        .from('tags')
        .select()
        .eq('project_id', projectId)
        .order('name');
    return rows.map((row) => tagFromRow(row)).toList();
  }

  Future<void> insert(Tag tag, String userId) async {
    await _client.from('tags').insert({
      'id': tag.id,
      'user_id': userId,
      'project_id': tag.projectId,
      'name': tag.name,
      'color_code': tag.color,
    });
  }

  Future<void> update(String id, {String? name, String? color}) async {
    await _client
        .from('tags')
        .update({'name': ?name, 'color_code': color})
        .eq('id', id);
  }

  Future<void> delete(String id) async {
    await _client.from('tags').delete().eq('id', id);
  }
}

class CompletionRepository {
  Future<List<TodoCompletion>> listSince(
    List<String> todoIds,
    DateTime since,
  ) async {
    if (todoIds.isEmpty) return const [];
    final rows = await _client
        .from('todo_completions')
        .select()
        .inFilter('todo_id', todoIds)
        .gte('completed_at', since.toIso8601String())
        .order('completed_at', ascending: false);
    return rows.map((row) => completionFromRow(row)).toList();
  }

  Future<void> insert(
    String todoId,
    String userId,
    DateTime completedAt,
  ) async {
    await _client.from('todo_completions').insert({
      'id': _uuid.v4(),
      'todo_id': todoId,
      'user_id': userId,
      'completed_at': completedAt.toIso8601String(),
    });
  }

  Future<void> delete(String id) async {
    await _client.from('todo_completions').delete().eq('id', id);
  }
}

class GamificationRepository {
  Future<GamificationData> load({int days = 365}) async {
    final tz = await _localTimeZone();
    final results = await Future.wait([
      _client.rpc('daily_epic_logs_tz', params: {'p_tz': tz, 'p_days': days}),
      _client.rpc('epic_streaks', params: {'p_tz': tz}),
      _client.rpc('streak_global', params: {'p_tz': tz}),
    ]);

    final logs = (results[0] as List)
        .whereType<Map>()
        .map(
          (row) => DailyLog(
            day: DateTime.parse(row['day'].toString()),
            epicId: row['epic_id'].toString(),
            count: (row['completed_count'] as num?)?.toInt() ?? 0,
          ),
        )
        .toList();
    final streaks = (results[1] as List)
        .whereType<Map>()
        .map(
          (row) => EpicStreak(
            epicId: row['epic_id'].toString(),
            current: (row['current_streak'] as num?)?.toInt() ?? 0,
            best: (row['best_streak'] as num?)?.toInt() ?? 0,
          ),
        )
        .toList();
    final globalRows = (results[2] as List).whereType<Map>().toList();
    final global = globalRows.isEmpty
        ? const GlobalStreak(current: 0, best: 0)
        : GlobalStreak(
            current: (globalRows.first['current_streak'] as num?)?.toInt() ?? 0,
            best: (globalRows.first['best_streak'] as num?)?.toInt() ?? 0,
          );
    return GamificationData(logs: logs, streaks: streaks, globalStreak: global);
  }

  Future<String> _localTimeZone() async {
    try {
      final info = await FlutterTimezone.getLocalTimezone();
      return info.identifier;
    } catch (_) {
      return 'UTC';
    }
  }
}

class BackupService {
  static const _tables = [
    'epics',
    'projects',
    'todos',
    'tags',
    'todo_completions',
  ];
  static const _chunkSize = 100;

  Future<void> export(String userId) async {
    final data = <String, dynamic>{
      'version': 4,
      'exportedAt': DateTime.now().toIso8601String(),
    };
    for (final table in _tables) {
      final rows = await _client.from(table).select();
      final key = table == 'todo_completions' ? 'completions' : table;
      data[key] = rows;
    }
    final directory = await getTemporaryDirectory();
    final date = DateTime.now().toIso8601String().split('T').first;
    final file = File('${directory.path}/sisyflow-backup-$date.json');
    await file.writeAsString(const JsonEncoder.withIndent('  ').convert(data));
    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(file.path, mimeType: 'application/json')],
        subject: 'Backup de SisyFlow',
      ),
    );
  }

  Future<void> import(String userId) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.single;
    final raw = file.bytes != null
        ? utf8.decode(file.bytes!)
        : await File(file.path!).readAsString();
    final parsed = jsonDecode(raw);
    if (parsed is! Map) {
      throw const FormatException('Formato de backup inválido');
    }
    final version = parsed['version'];
    if (version != 4 && version != 3) {
      throw const FormatException(
        'Versión de backup no soportada en móvil (usá v3 o v4; los backups legacy de Dexie se importan desde el desktop)',
      );
    }

    List<Map<String, dynamic>> rows(String key) {
      final value = parsed[key];
      if (value is! List) return const [];
      return value
          .whereType<Map>()
          .map((row) => Map<String, dynamic>.from(row)..['user_id'] = userId)
          .toList();
    }

    await _upsert('epics', rows('epics'));
    await _upsert('projects', rows('projects'));
    await _upsert('todos', rows('todos'));
    await _upsert('todo_completions', rows('completions'));
    await _upsert('tags', rows('tags'));
  }

  Future<void> _upsert(String table, List<Map<String, dynamic>> rows) async {
    for (var index = 0; index < rows.length; index += _chunkSize) {
      final end = (index + _chunkSize).clamp(0, rows.length);
      await _client
          .from(table)
          .upsert(rows.sublist(index, end), onConflict: 'id');
    }
  }
}
