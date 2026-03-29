import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/supabase_providers.dart';
import '../data/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final client = ref.watch(supabaseClientProvider);
  return AuthRepository(client);
});

final authSessionProvider = StreamProvider<Session?>((ref) {
  final repository = ref.watch(authRepositoryProvider);

  final controller = StreamController<Session?>();
  controller.add(repository.currentSession);

  final subscription = repository.authStateChanges().listen((authState) {
    controller.add(authState.session);
  });

  ref.onDispose(() async {
    await subscription.cancel();
    await controller.close();
  });

  return controller.stream;
});

final authControllerProvider = Provider<AuthController>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthController(repository);
});

class AuthController {
  AuthController(this._repository);

  final AuthRepository _repository;

  Future<void> signIn({
    required String email,
    required String password,
  }) {
    return _repository.signIn(email: email, password: password);
  }

  Future<void> signUp({
    required String email,
    required String password,
  }) {
    return _repository.signUp(email: email, password: password);
  }

  Future<void> signOut() {
    return _repository.signOut();
  }
}
