class TimePeriodForecast {
  final String id;
  final String name;
  final String timeWindow;
  final int totalCapacity;
  final int occupancyPercentage;
  final int passengerCount;
  final String crowdStatus; // 'Light', 'Moderate', 'Heavy Peak'
  final String explanation;

  const TimePeriodForecast({
    required this.id,
    required this.name,
    required this.timeWindow,
    this.totalCapacity = 24,
    required this.occupancyPercentage,
    required this.passengerCount,
    required this.crowdStatus,
    required this.explanation,
  });
}

class DayCorridorForecast {
  final String dayName;
  final String dateLabel;
  final String weatherCondition;
  final double temperatureC;
  final String weatherDemandNote;
  final String peakCrowdLevel;
  final int peakPercentage;
  final String recommendedWindow;
  final List<TimePeriodForecast> periods;

  const DayCorridorForecast({
    required this.dayName,
    required this.dateLabel,
    required this.weatherCondition,
    required this.temperatureC,
    required this.weatherDemandNote,
    required this.peakCrowdLevel,
    required this.peakPercentage,
    required this.recommendedWindow,
    required this.periods,
  });
}
