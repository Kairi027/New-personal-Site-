import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomePage extends StatelessWidget {
  final Widget child;
  const HomePage({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final index = ['/community', '/trade', '/travel', '/weather', '/mine']
        .indexWhere((p) => location.startsWith(p));
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index < 0 ? 0 : index,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.forum), label: '社区'),
          BottomNavigationBarItem(icon: Icon(Icons.shop), label: '闲置'),
          BottomNavigationBarItem(icon: Icon(Icons.map), label: '出行'),
          BottomNavigationBarItem(icon: Icon(Icons.cloud), label: '天气'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: '我的'),
        ],
        onTap: (i) => context.go(['/community', '/trade', '/travel', '/weather', '/mine'][i]),
      ),
    );
  }
}