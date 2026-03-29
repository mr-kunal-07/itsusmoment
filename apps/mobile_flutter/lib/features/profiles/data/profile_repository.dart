import 'package:supabase_flutter/supabase_flutter.dart';

import 'profile_model.dart';

class ProfileRepository {
  ProfileRepository(this._client);

  final SupabaseClient _client;

  Future<ProfileModel> ensureProfile(User user) async {
    final existing = await _client
        .from('profiles')
        .select()
        .eq('user_id', user.id)
        .maybeSingle();

    if (existing != null) {
      return ProfileModel.fromMap(existing);
    }

    final payload = <String, dynamic>{
      'user_id': user.id,
      'display_name': _displayNameFromUser(user),
      'avatar_url': user.userMetadata?['avatar_url'] ??
          user.userMetadata?['picture'],
    };

    final inserted = await _client
        .from('profiles')
        .insert(payload)
        .select()
        .single();

    return ProfileModel.fromMap(inserted);
  }

  Future<List<ProfileModel>> fetchProfiles(List<String> userIds) async {
    if (userIds.isEmpty) {
      return const [];
    }

    final rows = await _client
        .from('profiles')
        .select()
        .inFilter('user_id', userIds);

    return rows
        .cast<Map<String, dynamic>>()
        .map(ProfileModel.fromMap)
        .toList(growable: false);
  }

  String _displayNameFromUser(User user) {
    final metadata = user.userMetadata ?? const <String, dynamic>{};

    final candidates = <String?>[
      metadata['display_name'] as String?,
      metadata['full_name'] as String?,
      metadata['name'] as String?,
      user.email?.split('@').first,
    ];

    for (final candidate in candidates) {
      if (candidate != null && candidate.trim().isNotEmpty) {
        return candidate.trim();
      }
    }

    return 'User';
  }
}
