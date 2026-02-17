/**
 * Compliance Calendar Component
 * Calendar view showing exercise completion over time
 *
 * Kalendervisning for overholdelse
 * Viser ovelsesfullforing over tid i kalenderformat
 */

import _React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  _Calendar,
  CheckCircle,
  _XCircle,
  Activity,
  Frown,
  Meh,
  Smile,
} from 'lucide-react';

/**
 * ComplianceCalendar Component
 * Displays exercise completion in a calendar format
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Daily progress data array
 * @param {Function} props.onDateSelect - Callback when date is selected
 * @returns {JSX.Element} Compliance calendar component
 */
export default function ComplianceCalendar({ data = [], onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Norwegian day and month names
  const dayNames = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor', 'Son'];
  const monthNames = [
    'Januar',
    'Februar',
    'Mars',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  /**
   * Create a map of progress data by date string
   */
  const progressMap = useMemo(() => {
    const map = new Map();
    data.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      map.set(dateStr, item);
    });
    return map;
  }, [data]);

  /**
   * Get calendar days for the current month
   */
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week (0-6, where 0 is Sunday)
    // Convert to Monday = 0
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) {
      startDayOfWeek = 6;
    }

    const days = [];

    // Add previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks x 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  /**
   * Navigate to previous month
   */
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  /**
   * Navigate to next month
   */
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  /**
   * Handle date selection
   */
  const handleDateClick = (day) => {
    if (!day.isCurrentMonth) {
      return;
    }

    setSelectedDate(day.date);
    if (onDateSelect) {
      const dateStr = day.date.toISOString().split('T')[0];
      const dayData = progressMap.get(dateStr);
      onDateSelect(day.date, dayData);
    }
  };

  /**
   * Get completion status for a day
   */
  const getDayStatus = (day) => {
    const dateStr = day.date.toISOString().split('T')[0];
    const dayData = progressMap.get(dateStr);

    if (!dayData) {
      return null;
    }

    return {
      completionRate: dayData.completionRate || 0,
      exercisesDone: dayData.exercisesDone || 0,
      totalPrescribed: dayData.totalPrescribed || 0,
      avgPain: dayData.avgPain,
    };
  };

  /**
   * Get cell color based on completion rate
   */
  const getCellColor = (status) => {
    if (!status) {
      return '';
    }
    const rate = status.completionRate;
    if (rate >= 80) {
      return 'bg-green-100 hover:bg-green-200 border-green-300';
    }
    if (rate >= 50) {
      return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
    }
    if (rate > 0) {
      return 'bg-orange-100 hover:bg-orange-200 border-orange-300';
    }
    return 'bg-gray-100 hover:bg-gray-200 border-gray-300';
  };

  /**
   * Get pain emoji
   */
  const getPainEmoji = (level) => {
    if (!level) {
      return null;
    }
    if (level <= 3) {
      return <Smile className="w-3 h-3 text-green-500" />;
    }
    if (level <= 6) {
      return <Meh className="w-3 h-3 text-yellow-500" />;
    }
    return <Frown className="w-3 h-3 text-red-500" />;
  };

  /**
   * Check if date is today
   */
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  /**
   * Check if date is selected
   */
  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // Get selected date details
  const selectedDateData = selectedDate
    ? progressMap.get(selectedDate.toISOString().split('T')[0])
    : null;

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const status = getDayStatus(day);
          const cellColor = getCellColor(status);
          const isFutureDate = day.date > new Date();

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              disabled={!day.isCurrentMonth || isFutureDate}
              className={`
                relative h-14 p-1 rounded-lg border transition-all text-center
                ${day.isCurrentMonth ? 'cursor-pointer' : 'cursor-default'}
                ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400 border-transparent' : ''}
                ${day.isCurrentMonth && !status ? 'bg-white border-gray-200 hover:bg-gray-50' : ''}
                ${day.isCurrentMonth && status ? cellColor : ''}
                ${isToday(day.date) ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                ${isSelected(day.date) ? 'ring-2 ring-purple-500 ring-offset-1' : ''}
                ${isFutureDate ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                text-sm font-medium
                ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${isToday(day.date) ? 'text-blue-600' : ''}
              `}
              >
                {day.date.getDate()}
              </span>

              {/* Completion indicator */}
              {day.isCurrentMonth && status && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex items-center gap-0.5">
                  {status.completionRate >= 80 ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : status.completionRate > 0 ? (
                    <Activity className="w-3 h-3 text-yellow-600" />
                  ) : null}
                  {status.avgPain && getPainEmoji(parseFloat(status.avgPain))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span className="text-xs text-gray-600">Utmerket (80%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span className="text-xs text-gray-600">Middels (50-79%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
          <span className="text-xs text-gray-600">Lav (1-49%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
          <span className="text-xs text-gray-600">Ingen</span>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            {selectedDate.toLocaleDateString('no-NO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h4>
          {selectedDateData ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ovelser fullfort</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedDateData.exercisesDone} / {selectedDateData.totalPrescribed}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Overholdelse</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedDateData.completionRate}%
                </p>
              </div>
              {selectedDateData.avgPain && (
                <div>
                  <p className="text-sm text-gray-500">Gjennomsnittlig smerte</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedDateData.avgPain}/10
                    </p>
                    {getPainEmoji(parseFloat(selectedDateData.avgPain))}
                  </div>
                </div>
              )}
              {selectedDateData.exerciseNames && selectedDateData.exerciseNames.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Fullforte ovelser</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDateData.exerciseNames.map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Ingen treningsdata registrert for denne dagen</p>
          )}
        </div>
      )}
    </div>
  );
}
