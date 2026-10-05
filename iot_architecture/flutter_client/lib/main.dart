import 'package:flutter/material.dart';
import 'screens/onboarding_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/main_navigation_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FlowJeepApp());
}

class FlowJeepApp extends StatelessWidget {
  const FlowJeepApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FlowJeep Modern Paratransit',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF800020), // FlowJeep Burgundy
          primary: const Color(0xFF800020),
          secondary: const Color(0xFF007A37), // Transit Green
          tertiary: const Color(0xFF0288D1), // Pickup Sky Blue
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        fontFamily: 'Inter',
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF800020),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const FlowJeepAppFlowController(),
    );
  }
}

enum AppFlowState { onboarding, auth, main }

class FlowJeepAppFlowController extends StatefulWidget {
  const FlowJeepAppFlowController({super.key});

  @override
  State<FlowJeepAppFlowController> createState() => _FlowJeepAppFlowControllerState();
}

class _FlowJeepAppFlowControllerState extends State<FlowJeepAppFlowController> {
  AppFlowState _flowState = AppFlowState.onboarding;
  String _userName = 'Aldrian Cabaccan';
  String _userEmail = 'aldriancabaccan905@gmail.com';

  void _onOnboardingComplete() {
    setState(() => _flowState = AppFlowState.auth);
  }

  void _onAuthSuccess(String name, String email) {
    setState(() {
      _userName = name;
      _userEmail = email;
      _flowState = AppFlowState.main;
    });
  }

  void _onLogout() {
    setState(() => _flowState = AppFlowState.auth);
  }

  @override
  Widget build(BuildContext context) {
    switch (_flowState) {
      case AppFlowState.onboarding:
        return OnboardingScreen(onFinish: _onOnboardingComplete);
      case AppFlowState.auth:
        return AuthScreen(onAuthSuccess: _onAuthSuccess);
      case AppFlowState.main:
        return MainNavigationShell(
          userName: _userName,
          userEmail: _userEmail,
          onLogout: _onLogout,
        );
    }
  }
}
