import 'chat_reaction.dart';

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.coupleId,
    required this.content,
    required this.createdAt,
    required this.reactions,
    this.readAt,
    this.replyToId,
    this.messageType,
    this.audioUrl,
    this.deletedAt,
  });

  final String id;
  final String senderId;
  final String coupleId;
  final String content;
  final DateTime createdAt;
  final DateTime? readAt;
  final String? replyToId;
  final String? messageType;
  final String? audioUrl;
  final DateTime? deletedAt;
  final List<ChatReaction> reactions;

  bool get isDeleted => deletedAt != null;

  ChatMessage copyWith({
    String? content,
    List<ChatReaction>? reactions,
  }) {
    return ChatMessage(
      id: id,
      senderId: senderId,
      coupleId: coupleId,
      content: content ?? this.content,
      createdAt: createdAt,
      readAt: readAt,
      replyToId: replyToId,
      messageType: messageType,
      audioUrl: audioUrl,
      deletedAt: deletedAt,
      reactions: reactions ?? this.reactions,
    );
  }

  factory ChatMessage.fromMap(
    Map<String, dynamic> map, {
    List<ChatReaction> reactions = const [],
    required String content,
  }) {
    return ChatMessage(
      id: map['id'] as String,
      senderId: map['sender_id'] as String,
      coupleId: map['couple_id'] as String,
      content: content,
      createdAt: DateTime.tryParse(map['created_at'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      readAt: DateTime.tryParse(map['read_at'] as String? ?? ''),
      replyToId: map['reply_to_id'] as String?,
      messageType: map['message_type'] as String?,
      audioUrl: map['audio_url'] as String?,
      deletedAt: DateTime.tryParse(map['deleted_at'] as String? ?? ''),
      reactions: reactions,
    );
  }
}
