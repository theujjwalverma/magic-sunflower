export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function formatLocalTime(timestamp: string): string {
  // Parse the timestamp (assuming timestamps from database are UTC)
  const date = new Date(timestamp);
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Show relative time for recent events
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older dates, show formatted local date with time
  // Use the browser's built-in locale conversion
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTimeDifferenceInMinutes(timestamp: string): number {
  const date = new Date(timestamp);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
}

export function canDeletePost(timestamp: string): boolean {
  const minutesDiff = getTimeDifferenceInMinutes(timestamp);
  return minutesDiff <= 5; // Allow deletion within 5 minutes
}

export function getMinutesUntilCanDelete(timestamp: string): number {
  const minutesDiff = getTimeDifferenceInMinutes(timestamp);
  return Math.max(0, 5 - minutesDiff);
}

export function formatRemainingTime(minutes: number): string {
  if (minutes <= 0) return '0m';
  return `${minutes}m`;
}

export function getServerTimeDifference(timestamp: string): number {
  // Use UTC-based calculation for server-side consistency
  const utcDate = new Date(timestamp);
  const now = new Date();
  return Math.floor((now.getTime() - utcDate.getTime()) / (1000 * 60));
}

export function formatChatTime(timestamp: string): string {
  // Parse the timestamp and use browser's built-in locale conversion
  const date = new Date(timestamp);
  
  // Format as time only (HH:MM) for chat messages
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
