import '../models/forecast_model.dart';

class ForecastService {
  static const List<String> weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  static DayCorridorForecast getForecastForDay(String dayName, {String corridorName = 'Fairview - Buendia via Quezon Ave'}) {
    final bool isWeekend = dayName == 'Saturday' || dayName == 'Sunday';
    final bool isFriday = dayName == 'Friday';

    final int peakBase = isFriday ? 92 : (isWeekend ? 65 : 85);
    final String crowd = peakBase >= 90 ? 'Heavy Surge' : (peakBase >= 75 ? 'Moderate to High' : 'Normal');

    final periods = [
      TimePeriodForecast(
        id: 'p1',
        name: 'Early Worker Dispatch',
        timeWindow: '5:30 AM – 6:30 AM',
        totalCapacity: 24,
        occupancyPercentage: isWeekend ? 35 : 70,
        passengerCount: isWeekend ? 8 : 17,
        crowdStatus: isWeekend ? 'Light' : 'Moderate',
        explanation: 'Early government and construction worker shift departures toward Quezon City Hall and Manila.',
      ),
      TimePeriodForecast(
        id: 'p2',
        name: 'Morning Peak Rush',
        timeWindow: '6:30 AM – 9:00 AM',
        totalCapacity: 24,
        occupancyPercentage: peakBase,
        passengerCount: (24 * (peakBase / 100)).round(),
        crowdStatus: 'Heavy Peak',
        explanation: 'Heavy student and office worker flow through Philcoa, España University Belt, and Taft Ave.',
      ),
      TimePeriodForecast(
        id: 'p3',
        name: 'Midday Off-Peak',
        timeWindow: '10:00 AM – 2:30 PM',
        totalCapacity: 24,
        occupancyPercentage: isWeekend ? 55 : 42,
        passengerCount: isWeekend ? 13 : 10,
        crowdStatus: 'Light',
        explanation: 'Plentiful seats available along Philcoa and Quezon Avenue terminals.',
      ),
      TimePeriodForecast(
        id: 'p4',
        name: 'Afternoon School Surge',
        timeWindow: '3:00 PM – 5:00 PM',
        totalCapacity: 24,
        occupancyPercentage: isWeekend ? 48 : 78,
        passengerCount: isWeekend ? 11 : 19,
        crowdStatus: isWeekend ? 'Moderate' : 'High Surge',
        explanation: 'Dismissal from UST, FEU, UP Diliman, and Philcoa transit hubs.',
      ),
      TimePeriodForecast(
        id: 'p5',
        name: 'Evening Homeward Rush',
        timeWindow: '5:30 PM – 8:30 PM',
        totalCapacity: 24,
        occupancyPercentage: isFriday ? 98 : (isWeekend ? 62 : 90),
        passengerCount: isFriday ? 24 : (isWeekend ? 15 : 22),
        crowdStatus: 'Extreme Peak',
        explanation: 'Major homeward flow bound for Commonwealth, Tandang Sora, Fairview, and San Jose Del Monte.',
      ),
      TimePeriodForecast(
        id: 'p6',
        name: 'Night Sweep',
        timeWindow: '8:30 PM – 11:00 PM',
        totalCapacity: 24,
        occupancyPercentage: 40,
        passengerCount: 10,
        crowdStatus: 'Light',
        explanation: 'Steadily easing passenger volume with shorter queue intervals at MRT stations.',
      ),
    ];

    return DayCorridorForecast(
      dayName: dayName,
      dateLabel: 'Corridor: $corridorName',
      weatherCondition: 'Tropical Rain Showers',
      temperatureC: 30.5,
      weatherDemandNote: 'Rain bursts expected along Commonwealth Ave. Passenger boarding times increase by ~4 minutes.',
      peakCrowdLevel: crowd,
      peakPercentage: peakBase,
      recommendedWindow: '9:45 AM – 2:15 PM (Best travel comfort)',
      periods: periods,
    );
  }
}
