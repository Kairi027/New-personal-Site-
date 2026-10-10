import 'package:flutter/material.dart';

class UserStore extends ChangeNotifier {
  String? _token;
  Map<String, dynamic>? _userInfo;

  String? get token => _token;
  bool get isLoggedIn => _token != null;

  void setToken(String t) { _token = t; notifyListeners(); }
  void setUserInfo(Map<String, dynamic> info) { _userInfo = info; notifyListeners(); }
  void logout() { _token = null; _userInfo = null; notifyListeners(); }
}