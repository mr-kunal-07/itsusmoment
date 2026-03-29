import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/application/auth_controller.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('usMoment Mobile'),
        actions: [
          IconButton(
            onPressed: () async {
              await ref.read(authControllerProvider).signOut();
              if (context.mounted) {
                context.go('/auth');
              }
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Mobile dashboard scaffold',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          const Text(
            'Chat couple lookup, partner profile loading, and encrypted message streaming are now scaffolded for mobile.',
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => context.go('/chat'),
            icon: const Icon(Icons.chat_bubble_outline),
            label: const Text('Open shared chat'),
          ),
        ],
      ),
    );
  }
}
