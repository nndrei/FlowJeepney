import 'package:flutter/material.dart';

class AuthScreen extends StatefulWidget {
  final Function(String name, String email) onAuthSuccess;

  const AuthScreen({super.key, required this.onAuthSuccess});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isSignUp = false;
  final TextEditingController _nameController = TextEditingController(text: 'Aldrian Cabaccan');
  final TextEditingController _emailController = TextEditingController(text: 'aldriancabaccan905@gmail.com');
  final TextEditingController _passwordController = TextEditingController(text: 'flowjeep2026');

  void _handleSubmit() {
    final name = _nameController.text.trim().isEmpty ? 'Commuter' : _nameController.text.trim();
    final email = _emailController.text.trim().isEmpty ? 'aldriancabaccan905@gmail.com' : _emailController.text.trim();
    widget.onAuthSuccess(name, email);
  }

  void _handleGuestAccess() {
    widget.onAuthSuccess('Aldrian Cabaccan', 'aldriancabaccan905@gmail.com');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              // App Brand Header
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFF800020),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF800020).withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.directions_bus_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'FlowJeep',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF800020),
                          letterSpacing: -0.5,
                        ),
                      ),
                      Text(
                        'Modern Paratransit Network',
                        style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 36),

              Text(
                _isSignUp ? 'Create Commuter Account' : 'Welcome to FlowJeep',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _isSignUp
                  ? 'Sign up to track jeeps, broadcast wait signals, and plan commutes.'
                  : 'Sign in to access live Modern Jeepney corridors and arrival times.',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),

              const SizedBox(height: 28),

              if (_isSignUp) ...[
                const Text('Full Name', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                    hintText: 'Juan Dela Cruz',
                    filled: true,
                    fillColor: Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              const Text('Email Address', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.email_outlined, size: 20),
                  hintText: 'commuter@example.ph',
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),

              const SizedBox(height: 16),

              const Text('Password', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                  hintText: '••••••••',
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),

              const SizedBox(height: 26),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF800020),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 2,
                  ),
                  child: Text(
                    _isSignUp ? 'Create Account' : 'Sign In',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Quick Guest / Demo Access
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _handleGuestAccess,
                  icon: const Icon(Icons.bolt_rounded, size: 18, color: Color(0xFF0288D1)),
                  label: const Text(
                    'Instant Commuter Demo Mode',
                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: Color(0xFF0288D1)),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Color(0xFF0288D1)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Toggle Sign In / Sign Up
              Center(
                child: GestureDetector(
                  onTap: () => setState(() => _isSignUp = !_isSignUp),
                  child: Text.rich(
                    TextSpan(
                      text: _isSignUp ? 'Already have an account? ' : "Don't have an account? ",
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                      children: [
                        TextSpan(
                          text: _isSignUp ? 'Sign In' : 'Sign Up',
                          style: const TextStyle(
                            color: Color(0xFF800020),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
