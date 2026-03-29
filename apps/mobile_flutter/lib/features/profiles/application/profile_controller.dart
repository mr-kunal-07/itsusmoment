import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/supabase_providers.dart';
import '../../auth/application/auth_controller.dart';
import '../../couples/application/couple_controller.dart';
import '../data/profile_model.dart';
import '../data/profile_repository.dart';

final profileRepositoryProvider = Provider<ProfileRepository?>((ref) {
  final client = ref.watch(supabaseClientProvider);
  if (client == null) {
    return null;
  }

  return ProfileRepository(client);
});

final myProfileProvider = FutureProvider<ProfileModel?>((ref) async {
  final repository = ref.watch(profileRepositoryProvider);
  final session = ref.watch(authSessionProvider).valueOrNull;

  if (repository == null || session == null) {
    return null;
  }

  return repository.ensureProfile(session.user);
});

final partnerProfileProvider = FutureProvider<ProfileModel?>((ref) async {
  final repository = ref.watch(profileRepositoryProvider);
  final session = ref.watch(authSessionProvider).valueOrNull;
  final couple = ref.watch(currentCoupleProvider).valueOrNull;

  if (repository == null || session == null || couple == null || !couple.isActive) {
    return null;
  }

  final partnerId = couple.partnerIdFor(session.user.id);
  if (partnerId == null || partnerId.isEmpty) {
    return null;
  }

  final profiles = await repository.fetchProfiles([partnerId]);
  if (profiles.isNotEmpty) {
    return profiles.first;
  }

  return null;
});
