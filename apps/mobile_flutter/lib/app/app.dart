import 'package:flutter/material.dart';

import 'router.dart';

class UsMomentMobileApp extends StatelessWidget {
  const UsMomentMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'usMoment',
      debugShowCheckedModeBanner: false,
      routerConfig: appRouter,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1F7A5C)),
        useMaterial3: true,
      ),
    );
  }
}
