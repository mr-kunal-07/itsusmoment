import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';

class ChatCrypto {
  ChatCrypto._();

  static const _appSalt = 'kunalkalynai-v1-couple-key';
  static final _keyCache = <String, SecretKey>{};
  static final _pbkdf2 = Pbkdf2(
    macAlgorithm: Hmac.sha256(),
    iterations: 100000,
    bits: 256,
  );
  static final _algorithm = AesGcm.with256bits();

  static Future<String> encryptText({
    required String plaintext,
    required String coupleId,
  }) async {
    final key = await _deriveKey(coupleId);
    final nonce = _randomBytes(12);
    final secretBox = await _algorithm.encrypt(
      utf8.encode(plaintext),
      secretKey: key,
      nonce: nonce,
    );

    final combined = Uint8List.fromList([
      ...secretBox.nonce,
      ...secretBox.cipherText,
      ...secretBox.mac.bytes,
    ]);

    return 'enc:${base64Encode(combined)}';
  }

  static Future<String> decryptText({
    required String cipherText,
    required String coupleId,
  }) async {
    if (!cipherText.startsWith('enc:')) {
      return cipherText;
    }

    try {
      final key = await _deriveKey(coupleId);
      final bytes = base64Decode(cipherText.substring(4));
      if (bytes.length < 28) {
        return 'Locked message';
      }

      final nonce = bytes.sublist(0, 12);
      final macBytes = bytes.sublist(bytes.length - 16);
      final encryptedBytes = bytes.sublist(12, bytes.length - 16);
      final secretBox = SecretBox(
        encryptedBytes,
        nonce: nonce,
        mac: Mac(macBytes),
      );

      final plainBytes = await _algorithm.decrypt(
        secretBox,
        secretKey: key,
      );

      return utf8.decode(plainBytes);
    } catch (_) {
      return 'Locked message';
    }
  }

  static Future<SecretKey> _deriveKey(String coupleId) async {
    final cached = _keyCache[coupleId];
    if (cached != null) {
      return cached;
    }

    final key = await _pbkdf2.deriveKey(
      secretKey: SecretKey(utf8.encode(coupleId)),
      nonce: utf8.encode(_appSalt),
    );

    _keyCache[coupleId] = key;
    return key;
  }

  static List<int> _randomBytes(int length) {
    final random = Random.secure();
    return List<int>.generate(length, (_) => random.nextInt(256));
  }
}
