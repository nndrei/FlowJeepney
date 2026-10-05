class FareCalculationResult {
  final double distanceKm;
  final double regularFare;
  final double discountedFare; // 20% discount for Students, PWDs, Senior Citizens
  final String fareBreakdown;

  const FareCalculationResult({
    required this.distanceKm,
    required this.regularFare,
    required this.discountedFare,
    required this.fareBreakdown,
  });
}

class FareService {
  // Official LTFRB Modern PUV Fare Matrix (National Capital Region)
  static const double baseFareRegular = 15.00; // First 4.0 km
  static const double perKmRateRegular = 2.20;  // Per succeeding km
  static const double discountRate = 0.20;      // 20% statutory discount

  static FareCalculationResult calculateFare(double distanceKm) {
    final double cleanDist = distanceKm.clamp(0.1, 80.0);
    double regular = baseFareRegular;

    if (cleanDist > 4.0) {
      final double excessKm = cleanDist - 4.0;
      regular += excessKm * perKmRateRegular;
    }

    // Round to nearest 0.25 (standard Philippine coin denomination)
    final double roundedRegular = (regular * 4).round() / 4.0;
    final double discounted = roundedRegular * (1.0 - discountRate);
    final double roundedDiscounted = (discounted * 4).round() / 4.0;

    String breakdown;
    if (cleanDist <= 4.0) {
      breakdown = 'Base Fare: ₱${baseFareRegular.toStringAsFixed(2)} (First 4 km)';
    } else {
      final double excess = cleanDist - 4.0;
      final double excessCost = excess * perKmRateRegular;
      breakdown = 'Base: ₱${baseFareRegular.toStringAsFixed(2)} + ₱${excessCost.toStringAsFixed(2)} (${excess.toStringAsFixed(1)} km @ ₱$perKmRateRegular/km)';
    }

    return FareCalculationResult(
      distanceKm: cleanDist,
      regularFare: roundedRegular,
      discountedFare: roundedDiscounted,
      fareBreakdown: breakdown,
    );
  }
}
