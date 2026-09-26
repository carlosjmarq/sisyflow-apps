import 'package:go_router/go_router.dart';

import 'features/auth/auth_screen.dart';
import 'features/auth/auth_view_model.dart';
import 'features/epics/epics_screen.dart';
import 'features/home/home_screen.dart';
import 'features/projects/project_screen.dart';
import 'features/search/search_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/shell/app_shell.dart';

GoRouter buildRouter(AuthViewModel auth) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: auth,
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      if (!auth.isAuthenticated) return loggingIn ? null : '/login';
      if (loggingIn) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, _) => const AuthScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [GoRoute(path: '/', builder: (_, _) => const HomeScreen())],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/epics', builder: (_, _) => const EpicsScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/settings',
                builder: (_, _) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/project/:id',
        builder: (context, state) => ProjectScreen(
          projectId: state.pathParameters['id']!,
          openTodoId: state.extra is String ? state.extra as String : null,
        ),
      ),
      GoRoute(path: '/search', builder: (_, _) => const SearchScreen()),
    ],
  );
}
