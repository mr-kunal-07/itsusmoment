import 'package:go_router/go_router.dart';

import '../features/auth/presentation/auth_screen.dart';
import '../features/bootstrap/presentation/bootstrap_screen.dart';
import '../features/chat/presentation/chat_screen.dart';
import '../features/dashboard/presentation/dashboard_screen.dart';
import '../features/shell/presentation/session_gate_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/bootstrap',
  routes: <GoRoute>[
    GoRoute(
      path: '/bootstrap',
      builder: (context, state) => const BootstrapScreen(),
    ),
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),
    GoRoute(
      path: '/session-gate',
      builder: (context, state) => const SessionGateScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/chat',
      builder: (context, state) => const ChatScreen(),
    ),
  ],
);
