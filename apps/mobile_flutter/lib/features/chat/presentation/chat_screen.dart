import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_controller.dart';
import '../../couples/application/couple_controller.dart';
import '../../profiles/application/profile_controller.dart';
import '../application/chat_controller.dart';
import '../data/chat_message.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authSessionProvider).valueOrNull;
    final coupleAsync = ref.watch(currentCoupleProvider);
    final partnerProfileAsync = ref.watch(partnerProfileProvider);
    final messagesAsync = ref.watch(chatMessagesProvider);

    final currentUserId = session?.user.id;
    final couple = coupleAsync.valueOrNull;
    final partnerName = partnerProfileAsync.valueOrNull?.displayName ?? 'Partner';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(partnerName),
            Text(
              couple?.isActive == true ? 'Connected' : 'Waiting for couple link',
              style: Theme.of(context).textTheme.labelMedium,
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) {
                if (couple == null) {
                  return const _ChatEmptyState(
                    title: 'No couple link yet',
                    message:
                        'Once both partners are linked, messages from your shared chat will appear here.',
                  );
                }

                if (!couple.isActive) {
                  return const _ChatEmptyState(
                    title: 'Invite still pending',
                    message:
                        'Your mobile chat data layer is ready, but the couple link still needs to become active.',
                  );
                }

                if (messages.isEmpty) {
                  return const _ChatEmptyState(
                    title: 'Start your conversation',
                    message:
                        'This screen now reads from Supabase and is ready to send encrypted text messages.',
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    final isMine = currentUserId != null &&
                        message.senderId == currentUserId;

                    return _MessageBubble(
                      message: message,
                      isMine: isMine,
                      onToggleReaction: () async {
                        await ref.read(chatControllerProvider).toggleReaction(
                              message: message,
                              emoji: 'love',
                            );
                      },
                      onDelete: isMine
                          ? () async {
                              await ref
                                  .read(chatControllerProvider)
                                  .deleteMessage(message.id);
                            }
                          : null,
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Could not load chat right now.\n$error',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      minLines: 1,
                      maxLines: 4,
                      enabled: couple?.isActive == true,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _handleSend(),
                      decoration: InputDecoration(
                        hintText: couple?.isActive == true
                            ? 'Type a message'
                            : 'Chat unlocks after couple link is active',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: couple?.isActive == true ? _handleSend : null,
                    child: const Text('Send'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSend() async {
    final text = _messageController.text;
    if (text.trim().isEmpty) {
      return;
    }

    try {
      await ref.read(chatControllerProvider).sendTextMessage(text);
      _messageController.clear();
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not send message: $error')),
      );
    }
  }
}

class _ChatEmptyState extends StatelessWidget {
  const _ChatEmptyState({
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 44,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.isMine,
    required this.onToggleReaction,
    this.onDelete,
  });

  final ChatMessage message;
  final bool isMine;
  final Future<void> Function() onToggleReaction;
  final Future<void> Function()? onDelete;

  @override
  Widget build(BuildContext context) {
    final bubbleColor = isMine
        ? Theme.of(context).colorScheme.primaryContainer
        : Theme.of(context).colorScheme.surfaceContainerHighest;
    final alignment =
        isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start;

    final label = switch (message.messageType) {
      'voice' => 'Voice message',
      'drawing' => 'Drawing',
      _ => null,
    };

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: Card(
          color: bubbleColor,
          margin: const EdgeInsets.only(bottom: 10),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
            child: Column(
              crossAxisAlignment: alignment,
              children: [
                if (label != null) ...[
                  Text(
                    label,
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 4),
                ],
                Text(message.content),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      _formatTime(message.createdAt),
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    TextButton(
                      onPressed: onToggleReaction,
                      child: Text(
                        message.reactions.isEmpty
                            ? 'React'
                            : 'Love ${message.reactions.length}',
                      ),
                    ),
                    if (onDelete != null)
                      TextButton(
                        onPressed: onDelete,
                        child: const Text('Delete'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final hours = dateTime.hour.toString().padLeft(2, '0');
    final minutes = dateTime.minute.toString().padLeft(2, '0');
    return '$hours:$minutes';
  }
}
