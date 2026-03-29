import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/supabase_providers.dart';
import '../../auth/application/auth_controller.dart';
import '../data/couple.dart';
import '../data/couple_repository.dart';

final coupleRepositoryProvider = Provider<CoupleRepository?>((ref) {
  final client = ref.watch(supabaseClientProvider);
  if (client == null) {
    return null;
  }

  return CoupleRepository(client);
});

final currentCoupleProvider = StreamProvider<Couple?>((ref) {
  final repository = ref.watch(coupleRepositoryProvider);
  final session = ref.watch(authSessionProvider).valueOrNull;

  if (repository == null || session == null) {
    return Stream.value(null);
  }

  return repository.watchMyCouple(session.user.id);
});
