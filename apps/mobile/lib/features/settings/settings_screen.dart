import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/events.dart';
import '../../core/theme.dart';
import '../../data/repositories.dart';
import '../auth/auth_view_model.dart';
import 'settings_view_model.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => SettingsViewModel(
        authRepository: context.read<AuthRepository>(),
        backupService: context.read<BackupService>(),
        dataChanges: context.read<DataChangeNotifier>(),
      ),
      child: const _SettingsView(),
    );
  }
}

class _SettingsView extends StatelessWidget {
  const _SettingsView();

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<SettingsViewModel>();
    final themeVm = context.watch<ThemeViewModel>();
    final auth = context.watch<AuthViewModel>();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Ajustes')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Tema', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          SegmentedButton<AppThemeMode>(
            segments: [
              for (final mode in AppThemeMode.values)
                ButtonSegment(value: mode, label: Text(themeModeLabels[mode]!)),
            ],
            selected: {themeVm.mode},
            onSelectionChanged: (selection) => themeVm.setMode(selection.first),
          ),
          const SizedBox(height: 24),
          Text('Cuenta', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              leading: const Icon(Icons.person_outline),
              title: Text(auth.user?.email ?? 'Sesión activa'),
              subtitle: const Text('Supabase · RLS por usuario'),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: auth.signOut,
            icon: const Icon(Icons.logout),
            label: const Text('Cerrar sesión'),
          ),
          const SizedBox(height: 24),
          Text('Backup', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.upload_file),
                  title: const Text('Exportar backup (v4)'),
                  subtitle: const Text('Comparte un JSON con todos tus datos'),
                  enabled: !vm.busy,
                  onTap: vm.exportBackup,
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.download),
                  title: const Text('Importar backup'),
                  subtitle: const Text('Acepta v3 y v4; upsert por id'),
                  enabled: !vm.busy,
                  onTap: vm.importBackup,
                ),
              ],
            ),
          ),
          if (vm.busy) ...[
            const SizedBox(height: 16),
            const Center(child: CircularProgressIndicator()),
          ],
          const SizedBox(height: 24),
          Text('Acerca de', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              leading: const Icon(Icons.landscape_outlined),
              title: const Text('SisyFlow móvil'),
              subtitle: const Text('0.1.0 · Flutter + Supabase'),
            ),
          ),
        ],
      ),
    );
  }
}
