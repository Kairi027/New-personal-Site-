import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});
  @override
  Widget build(BuildContext context) {
    Future.microtask(() => context.go('/community'));
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}