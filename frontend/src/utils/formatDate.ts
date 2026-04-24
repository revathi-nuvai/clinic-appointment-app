import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';

export const formatDate = (date: string): string => {
  return format(parseISO(date), 'dd MMM yyyy');
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const formatDateTime = (date: string, time: string): string => {
  return `${formatDate(date)} at ${formatTime(time)}`;
};

export const isAppointmentPast = (date: string, time: string): boolean => {
  const appointmentDate = new Date(`${date}T${time}`);
  return isPast(appointmentDate);
};

export const getRelativeDay = (date: string): string => {
  const parsed = parseISO(date);
  if (isToday(parsed)) return 'Today';
  if (isTomorrow(parsed)) return 'Tomorrow';
  return formatDate(date);
};

export const formatCreatedAt = (date: string): string => {
  return format(parseISO(date), 'dd MMM yyyy, hh:mm a');
};
