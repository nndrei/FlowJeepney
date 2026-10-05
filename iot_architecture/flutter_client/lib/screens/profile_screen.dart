import 'package:flutter/material.dart';
import '../widgets/fare_calculator_dialog.dart';
import '../widgets/settings_help_dialog.dart';

class ProfileScreen extends StatelessWidget {
  final String userName;
  final String userEmail;
  final VoidCallback onLogout;

  const ProfileScreen({
    super.key,
    required this.userName,
    required this.userEmail,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Commuter Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF800020),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 3)),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: const Color(0xFF1E293B),
                    child: Text(
                      userName.isNotEmpty ? userName[0].toUpperCase() : 'C',
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    userName,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    userEmail,
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF007A37).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          children: [
                            CircleAvatar(radius: 3, backgroundColor: Color(0xFF007A37)),
                            SizedBox(width: 6),
                            Text(
                              'Verified Commuter',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF007A37)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0288D1).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Metro Manila NCR',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0288D1)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // Commuter Action Tools List
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const CircleAvatar(
                      radius: 16,
                      backgroundColor: Color(0xFF800020),
                      child: Icon(Icons.payments_rounded, color: Colors.white, size: 18),
                    ),
                    title: const Text('LTFRB Fare Calculator', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    subtitle: const Text('Calculate regular and student/senior 20% discount', style: TextStyle(fontSize: 11)),
                    trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => const FareCalculatorDialog(),
                      );
                    },
                  ),
                  const Divider(height: 1, indent: 56),
                  ListTile(
                    leading: const CircleAvatar(
                      radius: 16,
                      backgroundColor: Color(0xFF0288D1),
                      child: Icon(Icons.settings_rounded, color: Colors.white, size: 18),
                    ),
                    title: const Text('Commuter Preferences', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    subtitle: const Text('Audio alerts, haptics, and language settings', style: TextStyle(fontSize: 11)),
                    trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => const SettingsDialog(),
                      );
                    },
                  ),
                  const Divider(height: 1, indent: 56),
                  ListTile(
                    leading: const CircleAvatar(
                      radius: 16,
                      backgroundColor: Color(0xFF007A37),
                      child: Icon(Icons.help_outline_rounded, color: Colors.white, size: 18),
                    ),
                    title: const Text('Help & Support', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    subtitle: const Text('LTFRB & MMDA emergency hotlines and system info', style: TextStyle(fontSize: 11)),
                    trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => const HelpSupportDialog(),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onLogout,
                icon: const Icon(Icons.logout_rounded, color: Color(0xFF800020), size: 18),
                label: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF800020))),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: Color(0xFF800020)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
