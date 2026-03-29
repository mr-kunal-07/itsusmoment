import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'couple.dart';

class CoupleRepository {
  CoupleRepository(this._client);

  final SupabaseClient _client;

  Stream<Couple?> watchMyCouple(String userId) {
    return _client
        .from('couples')
        .stream(primaryKey: ['id'])
        .or('user1_id.eq.$userId,user2_id.eq.$userId')
        .order('created_at', ascending: false)
        .map((rows) {
      if (rows.isEmpty) {
        return null;
      }

      return Couple.fromMap(rows.first);
    });
  }
}
