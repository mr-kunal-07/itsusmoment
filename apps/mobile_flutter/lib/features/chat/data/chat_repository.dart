import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'chat_crypto.dart';
import 'chat_message.dart';
import 'chat_reaction.dart';

class ChatRepository {
  ChatRepository(this._client);

  final SupabaseClient _client;

  Stream<List<ChatMessage>> watchMessages(String coupleId) {
    final controller = StreamController<List<ChatMessage>>();

    List<Map<String, dynamic>> latestMessages = const [];
    List<Map<String, dynamic>> latestReactions = const [];
    var isDisposed = false;

    Future<void> emitCombined() async {
      if (isDisposed) {
        return;
      }

      final visibleRows = latestMessages
          .where((row) => row['deleted_at'] == null)
          .toList(growable: false)
        ..sort((a, b) => (a['created_at'] as String? ?? '')
            .compareTo(b['created_at'] as String? ?? ''));

      final visibleIds = visibleRows
          .map((row) => row['id'] as String)
          .toSet();

      final reactionsByMessage = <String, List<ChatReaction>>{};
      for (final row in latestReactions) {
        final messageId = row['message_id'] as String?;
        if (messageId == null || !visibleIds.contains(messageId)) {
          continue;
        }

        reactionsByMessage.putIfAbsent(messageId, () => <ChatReaction>[]);
        reactionsByMessage[messageId]!.add(ChatReaction.fromMap(row));
      }

      final output = <ChatMessage>[];
      for (final row in visibleRows) {
        final messageId = row['id'] as String;
        final decryptedContent = await ChatCrypto.decryptText(
          cipherText: row['content'] as String? ?? '',
          coupleId: coupleId,
        );
        output.add(
          ChatMessage.fromMap(
            row,
            reactions: reactionsByMessage[messageId] ?? const [],
            content: decryptedContent,
          ),
        );
      }

      if (!isDisposed) {
        controller.add(output);
      }
    }

    final messageSubscription = _client
        .from('messages')
        .stream(primaryKey: ['id'])
        .eq('couple_id', coupleId)
        .listen((rows) {
      latestMessages = rows.cast<Map<String, dynamic>>();
      unawaited(emitCombined());
    }, onError: controller.addError);

    final reactionSubscription = _client
        .from('message_reactions')
        .stream(primaryKey: ['id'])
        .listen((rows) {
      latestReactions = rows.cast<Map<String, dynamic>>();
      unawaited(emitCombined());
    }, onError: controller.addError);

    controller.onCancel = () async {
      isDisposed = true;
      await messageSubscription.cancel();
      await reactionSubscription.cancel();
    };

    return controller.stream;
  }

  Future<void> sendTextMessage({
    required String senderId,
    required String coupleId,
    required String content,
  }) async {
    final encryptedContent = await ChatCrypto.encryptText(
      plaintext: content,
      coupleId: coupleId,
    );

    await _client.from('messages').insert({
      'sender_id': senderId,
      'couple_id': coupleId,
      'content': encryptedContent,
      'message_type': 'text',
    });
  }

  Future<void> deleteMessage({
    required String messageId,
    required String senderId,
  }) async {
    await _client
        .from('messages')
        .update({'deleted_at': DateTime.now().toUtc().toIso8601String()})
        .eq('id', messageId)
        .eq('sender_id', senderId);
  }

  Future<void> addReaction({
    required String messageId,
    required String userId,
    required String emoji,
  }) async {
    try {
      await _client.from('message_reactions').insert({
        'message_id': messageId,
        'user_id': userId,
        'emoji': emoji,
      });
    } on PostgrestException catch (error) {
      if (error.code != '23505') {
        rethrow;
      }
    }
  }

  Future<void> removeReaction({
    required String messageId,
    required String userId,
    required String emoji,
  }) async {
    await _client
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);
  }
}
