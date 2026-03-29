import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/supabase_providers.dart';
import '../../auth/application/auth_controller.dart';
import '../../couples/application/couple_controller.dart';
import '../data/chat_message.dart';
import '../data/chat_repository.dart';

final chatRepositoryProvider = Provider<ChatRepository?>((ref) {
  final client = ref.watch(supabaseClientProvider);
  if (client == null) {
    return null;
  }

  return ChatRepository(client);
});

final chatMessagesProvider = StreamProvider.autoDispose<List<ChatMessage>>((ref) {
  final repository = ref.watch(chatRepositoryProvider);
  final couple = ref.watch(currentCoupleProvider).valueOrNull;

  if (repository == null || couple == null || !couple.isActive) {
    return Stream.value(const []);
  }

  return repository.watchMessages(couple.id);
});

final chatControllerProvider = Provider<ChatController>((ref) {
  final repository = ref.watch(chatRepositoryProvider);
  return ChatController(ref, repository);
});

class ChatController {
  ChatController(this._ref, this._repository);

  final Ref _ref;
  final ChatRepository? _repository;

  Future<void> sendTextMessage(String rawText) async {
    final repository = _repository;
    final session = _ref.read(authSessionProvider).valueOrNull;
    final couple = _ref.read(currentCoupleProvider).valueOrNull;
    final trimmed = rawText.trim();

    if (repository == null ||
        session == null ||
        couple == null ||
        !couple.isActive ||
        trimmed.isEmpty) {
      return;
    }

    await repository.sendTextMessage(
      senderId: session.user.id,
      coupleId: couple.id,
      content: trimmed,
    );
  }

  Future<void> deleteMessage(String messageId) async {
    final repository = _repository;
    final session = _ref.read(authSessionProvider).valueOrNull;

    if (repository == null || session == null) {
      return;
    }

    await repository.deleteMessage(
      messageId: messageId,
      senderId: session.user.id,
    );
  }

  Future<void> toggleReaction({
    required ChatMessage message,
    required String emoji,
  }) async {
    final repository = _repository;
    final session = _ref.read(authSessionProvider).valueOrNull;
    if (repository == null || session == null) {
      return;
    }

    final alreadyReacted = message.reactions.any(
      (reaction) =>
          reaction.userId == session.user.id && reaction.emoji == emoji,
    );

    if (alreadyReacted) {
      await repository.removeReaction(
        messageId: message.id,
        userId: session.user.id,
        emoji: emoji,
      );
      return;
    }

    await repository.addReaction(
      messageId: message.id,
      userId: session.user.id,
      emoji: emoji,
    );
  }
}
