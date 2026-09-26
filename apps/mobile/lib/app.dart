import 'package:appflowy_editor/appflowy_editor.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/events.dart';
import 'core/feedback.dart';
import 'core/realtime.dart';
import 'core/theme.dart';
import 'data/repositories.dart';
import 'features/auth/auth_view_model.dart';
import 'router.dart';

class SisyFlowApp extends StatefulWidget {
  const SisyFlowApp({super.key, required this.authViewModel});

  final AuthViewModel authViewModel;

  @override
  State<SisyFlowApp> createState() => _SisyFlowAppState();
}

class _SisyFlowAppState extends State<SisyFlowApp> {
  late final GoRouter _router = buildRouter(widget.authViewModel);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => AuthRepository()),
        Provider(create: (_) => EpicRepository()),
        Provider(create: (_) => ProjectRepository()),
        Provider(create: (_) => TodoRepository()),
        Provider(create: (_) => TagRepository()),
        Provider(create: (_) => CompletionRepository()),
        Provider(create: (_) => GamificationRepository()),
        Provider(create: (_) => BackupService()),
        Provider<RealtimeBus>.value(value: widget.authViewModel.realtimeBus),
        ChangeNotifierProvider(create: (_) => DataChangeNotifier()),
        ChangeNotifierProvider.value(value: widget.authViewModel),
        ChangeNotifierProvider(create: (_) => ThemeViewModel()),
      ],
      child: Consumer<ThemeViewModel>(
        builder: (context, themeVm, _) => MaterialApp.router(
          title: 'SisyFlow',
          debugShowCheckedModeBanner: false,
          scaffoldMessengerKey: scaffoldMessengerKey,
          theme: buildAppTheme(Brightness.light),
          darkTheme: buildAppTheme(Brightness.dark),
          themeMode: themeVm.themeMode,
          locale: const Locale('es'),
          supportedLocales: const [Locale('es'), Locale('en')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            AppFlowyEditorLocalizations.delegate,
          ],
          routerConfig: _router,
        ),
      ),
    );
  }
}
