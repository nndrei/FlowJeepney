import 'package:flutter/material.dart';
import '../services/fare_service.dart';

class FareCalculatorDialog extends StatefulWidget {
  final double? initialDistanceKm;

  const FareCalculatorDialog({super.key, this.initialDistanceKm});

  @override
  State<FareCalculatorDialog> createState() => _FareCalculatorDialogState();
}

class _FareCalculatorDialogState extends State<FareCalculatorDialog> {
  late double _distanceKm;
  bool _isDiscounted = false;

  @override
  void initState() {
    super.initState();
    _distanceKm = widget.initialDistanceKm ?? 8.5;
  }

  @override
  Widget build(BuildContext context) {
    final fareResult = FareService.calculateFare(_distanceKm);
    final displayedFare = _isDiscounted ? fareResult.discountedFare : fareResult.regularFare;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title Header
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Color(0xFF800020),
                      child: Icon(Icons.payments_rounded, color: Colors.white, size: 18),
                    ),
                    SizedBox(width: 10),
                    Text(
                      'LTFRB Fare Calculator',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // Fare Output Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF800020), Color(0xFF5A0017)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF800020).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    _isDiscounted ? 'CONCESSIONARY FARE (20% OFF)' : 'STANDARD COMMUTER FARE',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 10.5,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '₱${displayedFare.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_distanceKm.toStringAsFixed(1)} km total journey distance',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Distance Slider
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text('Commute Distance:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(
                  '${_distanceKm.toStringAsFixed(1)} km',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF800020)),
                ),
              ],
            ),
            Slider(
              value: _distanceKm,
              min: 1.0,
              max: 35.0,
              divisions: 68,
              activeColor: const Color(0xFF800020),
              inactiveColor: Colors.grey.shade200,
              onChanged: (val) {
                setState(() => _distanceKm = val);
              },
            ),

            // Student / PWD / Senior Discount Toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.badge_rounded, size: 18, color: Color(0xFF007A37)),
                      SizedBox(width: 8),
                      Text(
                        'Student / Senior / PWD Discount',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  Switch(
                    value: _isDiscounted,
                    activeColor: const Color(0xFF007A37),
                    onChanged: (val) {
                      setState(() => _isDiscounted = val);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // LTFRB Rate Breakdown Note
            Text(
              fareResult.fareBreakdown,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 4),
            Text(
              'Governed by LTFRB Modern PUV Class 2 NCR fare matrix.',
              style: TextStyle(fontSize: 10, color: Colors.grey.shade400, fontStyle: FontStyle.italic),
            ),

            const SizedBox(height: 14),

            // Dismiss Button
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
                child: const Text('Done', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
