import {
  formatLastSeen,
  formatTime,
  isSameDay,
  formatChatDateSeparator,
  formatChatItemDate,
  formatLastMessageTime,
} from '@/shared/utils/date';

describe('Date utils', () => {
  describe('formatLastSeen', () => {
    it('returns "Offline" if isoString is null or undefined', () => {
      expect(formatLastSeen(null)).toBe('Offline');
      expect(formatLastSeen(undefined)).toBe('Offline');
      expect(formatLastSeen('')).toBe('Offline');
    });

    it('returns "Active just now" if less than 2 minutes ago', () => {
      const now = new Date();
      expect(formatLastSeen(now.toISOString())).toBe('Active just now');
    });

    it('returns minutes ago if between 2 and 59 minutes ago', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      expect(formatLastSeen(tenMinutesAgo.toISOString())).toBe('Last seen 10 minutes ago');
    });
  });

  describe('isSameDay', () => {
    it('returns true for matching day, month, and year', () => {
      const d1 = new Date(2026, 4, 10, 10, 0, 0);
      const d2 = new Date(2026, 4, 10, 18, 30, 0);
      expect(isSameDay(d1, d2)).toBe(true);
    });

    it('returns false for different days', () => {
      const d1 = new Date(2026, 4, 10);
      const d2 = new Date(2026, 4, 11);
      expect(isSameDay(d1, d2)).toBe(false);
    });
  });

  describe('formatChatDateSeparator', () => {
    it('returns "Today" for dates on the current day', () => {
      const now = new Date();
      expect(formatChatDateSeparator(now.toISOString())).toBe('Today');
    });

    it('returns empty string when input is empty', () => {
      expect(formatChatDateSeparator(null)).toBe('');
    });
  });

  describe('formatTime', () => {
    it('returns empty string for null or empty input', () => {
      expect(formatTime(null)).toBe('');
      expect(formatTime('')).toBe('');
    });

    it('formats a valid date string to time format', () => {
      const date = new Date(2026, 0, 1, 14, 30, 0);
      const result = formatTime(date.toISOString());
      expect(result).toBeTruthy();
    });
  });

  describe('formatLastMessageTime', () => {
    it('returns empty string for null or empty input', () => {
      expect(formatLastMessageTime(null)).toBe('');
      expect(formatLastMessageTime('')).toBe('');
    });

    it('returns a time stamp (not "Today") when the date is today', () => {
      const now = new Date();
      const result = formatLastMessageTime(now.toISOString());
      expect(result).not.toBe('Today');
      // Should match time format e.g. "14:30" or "02:30 PM"
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('returns "Yesterday" when the date was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatLastMessageTime(yesterday.toISOString())).toBe('Yesterday');
    });

    it('returns a formatted date string for older dates', () => {
      const olderDate = new Date(2025, 5, 15);
      const result = formatLastMessageTime(olderDate.toISOString());
      expect(result).not.toBe('Today');
      expect(result).not.toBe('Yesterday');
      expect(result).toBeTruthy();
    });
  });
});

