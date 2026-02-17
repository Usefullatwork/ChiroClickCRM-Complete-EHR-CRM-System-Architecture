/**
 * WeeklyScheduleView Component
 * Visuell ukesoversikt for treningsfrekvens
 *
 * Visual weekly overview for exercise frequency
 */

import { useState, useMemo } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

/**
 * WeeklyScheduleView Component
 * Viser en visuell kalender for ukentlig treningsplan
 *
 * @param {Object} props
 * @param {Array} props.exercises - Selected exercises with frequency settings
 * @param {Function} props.onExerciseClick - Click handler for exercise
 * @param {Date} props.startDate - Start date of the program
 */
const WeeklyScheduleView = ({ exercises = [], onExerciseClick, _startDate = new Date() }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Norwegian day names
  const dayNames = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor', 'Son'];
  const _dayNamesFull = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lordag', 'Sondag'];

  // Calculate current week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? 6 : currentDay - 1; // Adjust for Monday start

    const monday = new Date(today);
    monday.setDate(today.getDate() - diff + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  // Get exercises scheduled for a specific day
  const getExercisesForDay = (dayIndex) => {
    // dayIndex 0 = Monday, 6 = Sunday
    return exercises.filter((exercise) => {
      const frequencyPerWeek = exercise.frequencyPerWeek || 7;

      // Simple distribution logic based on frequency
      if (frequencyPerWeek === 7) {
        return true;
      } // Every day
      if (frequencyPerWeek === 6) {
        return dayIndex !== 6;
      } // Not Sunday
      if (frequencyPerWeek === 5) {
        return dayIndex < 5;
      } // Mon-Fri
      if (frequencyPerWeek === 4) {
        return [0, 1, 3, 4].includes(dayIndex);
      } // Mon, Tue, Thu, Fri
      if (frequencyPerWeek === 3) {
        return [0, 2, 4].includes(dayIndex);
      } // Mon, Wed, Fri
      if (frequencyPerWeek === 2) {
        return [0, 3].includes(dayIndex);
      } // Mon, Thu
      if (frequencyPerWeek === 1) {
        return dayIndex === 0;
      } // Monday only

      return false;
    });
  };

  // Calculate total time for day
  const getTotalTimeForDay = (dayExercises) => {
    return dayExercises.reduce((total, ex) => {
      const setsTime = (ex.sets || 3) * (ex.reps || 10) * 3;
      const holdTime = (ex.holdSeconds || 0) * (ex.sets || 3);
      return total + setsTime + holdTime + 30;
    }, 0);
  };

  // Get time of day sessions
  const _getSessionsForDay = (exercise) => {
    const frequencyPerDay = exercise.frequencyPerDay || 1;
    const sessions = [];

    if (frequencyPerDay >= 1) {
      sessions.push({ time: 'morgen', icon: Sun });
    }
    if (frequencyPerDay >= 2) {
      sessions.push({ time: 'kveld', icon: Moon });
    }
    if (frequencyPerDay >= 3) {
      sessions.push({ time: 'ettermiddag', icon: Clock });
    }

    return sessions;
  };

  // Format date for display
  const formatDate = (date) => {
    return date.getDate();
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get week range string
  const getWeekRangeString = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const options = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('nb-NO', options)} - ${end.toLocaleDateString('nb-NO', options)}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ukeoversikt</h2>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-600 min-w-[140px] text-center">
              {getWeekRangeString()}
            </span>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-blue-600 hover:text-blue-700 ml-2"
              >
                I dag
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Se hva pasienten skal trene hver dag basert på frekvensinnstillingene
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {exercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Ingen øvelser å vise</p>
            <p className="text-sm text-gray-400">Velg øvelser for å se ukeoversikten</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {dayNames.map((day, index) => (
              <div key={day} className="text-center">
                <div
                  className={`text-xs font-medium mb-1 ${
                    index >= 5 ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
                <div
                  className={`text-lg font-semibold mb-2 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                    isToday(weekDates[index]) ? 'bg-blue-600 text-white' : 'text-gray-900'
                  }`}
                >
                  {formatDate(weekDates[index])}
                </div>
              </div>
            ))}

            {/* Day Content */}
            {dayNames.map((_, dayIndex) => {
              const dayExercises = getExercisesForDay(dayIndex);
              const totalTime = getTotalTimeForDay(dayExercises);

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[120px] p-2 rounded-lg border ${
                    isToday(weekDates[dayIndex])
                      ? 'border-blue-300 bg-blue-50'
                      : dayIndex >= 5
                        ? 'border-gray-100 bg-gray-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  {dayExercises.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <span className="text-xs">Hviledag</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {/* Time estimate */}
                      <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                        <Clock className="w-3 h-3" />~{Math.ceil(totalTime / 60)} min
                      </div>

                      {/* Exercise pills */}
                      {dayExercises.slice(0, 3).map((exercise, i) => (
                        <button
                          key={exercise.id || i}
                          onClick={() => onExerciseClick?.(exercise)}
                          className="w-full text-left px-2 py-1 bg-green-100 text-green-800 rounded text-xs truncate hover:bg-green-200 transition-colors"
                          title={exercise.name_norwegian || exercise.name}
                        >
                          {exercise.name_norwegian || exercise.name}
                        </button>
                      ))}

                      {dayExercises.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayExercises.length - 3} flere
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {exercises.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-gray-600">
                <Dumbbell className="w-4 h-4" />
                {exercises.length} øvelser totalt
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                {exercises.reduce((sum, ex) => sum + (ex.frequencyPerWeek || 7), 0) /
                  exercises.length >=
                5
                  ? 'Daglig trening'
                  : exercises.reduce((sum, ex) => sum + (ex.frequencyPerWeek || 7), 0) /
                        exercises.length >=
                      3
                    ? 'Regelmessig trening'
                    : 'Moderat trening'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Program klart
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-600"></div>
            <span>I dag</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
            <span>Øvelse planlagt</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200"></div>
            <span>Hviledag</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleView;
