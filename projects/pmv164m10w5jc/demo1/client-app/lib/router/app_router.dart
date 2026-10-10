import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../pages/splash/splash_page.dart';
import '../pages/home/home_page.dart';
import '../pages/community/community_page.dart';
import '../pages/trade/trade_page.dart';
import '../pages/travel/travel_page.dart';
import '../pages/weather/weather_page.dart';
import '../pages/mine/mine_page.dart';
import '../pages/ai_chat/ai_chat_page.dart';
import '../pages/login/login_page.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const SplashPage()),
    GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
    ShellRoute(
      builder: (_, __, child) => HomePage(child: child),
      routes: [
        GoRoute(path: '/community', builder: (_, __) => const CommunityPage()),
        GoRoute(path: '/trade', builder: (_, __) => const TradePage()),
        GoRoute(path: '/travel', builder: (_, __) => const TravelPage()),
        GoRoute(path: '/weather', builder: (_, __) => const WeatherPage()),
        GoRoute(path: '/mine', builder: (_, __) => const MinePage()),
      ],
    ),
    GoRoute(path: '/ai-chat', builder: (_, __) => const AIChatPage()),
  ],
);