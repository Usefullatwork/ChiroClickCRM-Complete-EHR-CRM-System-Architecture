/**
 * Component Exports
 * Central export file for all components
 */

// Auth Components
export { PhoneInput } from './auth/PhoneInput';
export { OTPInput } from './auth/OTPInput';
export { SocialButtons } from './auth/SocialButtons';

// Common Components
export { Button } from './common/Button';
export { Card } from './common/Card';
export { Input } from './common/Input';
export { OfflineIndicator, useNetworkStatus } from './common/OfflineIndicator';

// Exercise Components
export { ExerciseCard } from './exercises/ExerciseCard';
export { VideoPlayer } from './exercises/VideoPlayer';
export { ExerciseTimer } from './exercises/ExerciseTimer';
export { CompletionModal } from './exercises/CompletionModal';

// Program Components
export { ProgramCard } from './programs/ProgramCard';
export { WeekView } from './programs/WeekView';
export { DaySchedule } from './programs/DaySchedule';

// Progress Components
export { StreakBadge } from './progress/StreakBadge';
export { ComplianceChart } from './progress/ComplianceChart';
export { PainTrendChart } from './progress/PainTrendChart';
