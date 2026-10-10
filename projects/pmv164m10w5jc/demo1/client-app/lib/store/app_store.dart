import 'package:provider/provider.dart';
import 'store/user_store.dart';

final appProviders = [
  ChangeNotifierProvider<UserStore>(create: (_) => UserStore()),
];