import 'package:supabase_flutter/supabase_flutter.dart';

class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient? _client;

  Session? get currentSession => _client?.auth.currentSession;

  Stream<AuthState> authStateChanges() {
    if (_client == null) {
      return const Stream<AuthState>.empty();
    }
    return _client!.auth.onAuthStateChange;
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    if (_client == null) {
      throw Exception('Supabase is not configured yet.');
    }

    await _client!.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> signUp({
    required String email,
    required String password,
  }) async {
    if (_client == null) {
      throw Exception('Supabase is not configured yet.');
    }

    await _client!.auth.signUp(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> signOut() async {
    if (_client == null) return;
    await _client!.auth.signOut();
  }
}
