class Couple {
  const Couple({
    required this.id,
    required this.user1Id,
    required this.user2Id,
    required this.inviteCode,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String user1Id;
  final String? user2Id;
  final String inviteCode;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get isActive => status == 'active';

  String? partnerIdFor(String currentUserId) {
    if (user1Id == currentUserId) {
      return user2Id;
    }

    return user1Id;
  }

  factory Couple.fromMap(Map<String, dynamic> map) {
    return Couple(
      id: map['id'] as String,
      user1Id: map['user1_id'] as String,
      user2Id: map['user2_id'] as String?,
      inviteCode: (map['invite_code'] as String?) ?? '',
      status: (map['status'] as String?) ?? 'pending',
      createdAt: DateTime.tryParse(map['created_at'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      updatedAt: DateTime.tryParse(map['updated_at'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}
