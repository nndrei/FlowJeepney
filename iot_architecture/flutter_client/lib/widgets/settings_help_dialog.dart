import 'package:flutter/material.dart';

class SettingsDialog extends StatefulWidget {
  const SettingsDialog({super.key});

  @override
  State<SettingsDialog> createState() => _SettingsDialogState();
}

class _SettingsDialogState extends State<SettingsDialog> {
  bool _audioChime = true;
  bool _vibrationAlerts = true;
  bool _highContrastCorridors = false;
  String _language = 'English';

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Color(0xFF800020),
                      child: Icon(Icons.settings_rounded, color: Colors.white, size: 18),
                    ),
                    SizedBox(width: 10),
                    Text('Commuter Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Approaching Jeep Sound Chime', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
              subtitle: const Text('Plays chime when signaled jeep is within 200m', style: TextStyle(fontSize: 11)),
              activeColor: const Color(0xFF800020),
              value: _audioChime,
              onChanged: (val) => setState(() => _audioChime = val),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Haptic Vibration Alerts', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
              subtitle: const Text('Vibrates when driver acknowledges waiting signal', style: TextStyle(fontSize: 11)),
              activeColor: const Color(0xFF800020),
              value: _vibrationAlerts,
              onChanged: (val) => setState(() => _vibrationAlerts = val),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('High Contrast Road Corridors', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
              subtitle: const Text('Bolder route polylines for bright sunlight', style: TextStyle(fontSize: 11)),
              activeColor: const Color(0xFF800020),
              value: _highContrastCorridors,
              onChanged: (val) => setState(() => _highContrastCorridors = val),
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text('Language / Wika', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                DropdownButton<String>(
                  value: _language,
                  underline: const SizedBox(),
                  items: const [
                    DropdownMenuItem(value: 'English', child: Text('English')),
                    DropdownMenuItem(value: 'Filipino', child: Text('Filipino (Tagalog)')),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _language = val);
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF800020),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Save Preferences', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class HelpSupportDialog extends StatelessWidget {
  const HelpSupportDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Color(0xFF0288D1),
                      child: Icon(Icons.help_outline_rounded, color: Colors.white, size: 18),
                    ),
                    SizedBox(width: 10),
                    Text('Help & Support', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _supportItem(
              icon: Icons.phone_in_talk_rounded,
              title: 'LTFRB Hotline 1342',
              desc: 'Public utility vehicle complaints, fare disputes, and lost items.',
              color: const Color(0xFF007A37),
            ),
            const SizedBox(height: 10),
            _supportItem(
              icon: Icons.traffic_rounded,
              title: 'MMDA Hotline 136',
              desc: 'Metro Manila road congestion, flood alerts, and emergency response.',
              color: const Color(0xFF0288D1),
            ),
            const SizedBox(height: 10),
            _supportItem(
              icon: Icons.device_hub_rounded,
              title: 'FlowJeep Edge IoT Diagnostics',
              desc: 'Dual E18-D80NK optical tripwire and GNSS telemetry support.',
              color: const Color(0xFF800020),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF800020),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Close', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _supportItem({
    required IconData icon,
    required String title,
    required String desc,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.15)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: color,
            child: Icon(icon, size: 16, color: Colors.white),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(fontSize: 11, color: Colors.black87)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
