import { format, isToday, isYesterday, parseISO } from 'date-fns';

export interface DateStamp {
  date: string;
  user: string;
  dateDisplay: string;
}

export function extractDateStamps(content: string): DateStamp[] {
  const dateStampRegex = /<div class="date-stamp"[^>]*data-date="([^"]*)"[^>]*data-user="([^"]*)"[^>]*>(.*?)<\/div>/g;
  const stamps: DateStamp[] = [];
  let match;
  
  while ((match = dateStampRegex.exec(content)) !== null) {
    stamps.push({
      date: match[1],
      user: match[2],
      dateDisplay: match[3]
    });
  }
  
  return stamps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function hasTodayUpdate(content: string): boolean {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayPattern = new RegExp(`<div class="date-stamp"[^>]*data-date="${today}"`);
  return todayPattern.test(content);
}

export function getLastUpdateInfo(content: string): { date: string; user: string; isToday: boolean } | null {
  const stamps = extractDateStamps(content);
  if (stamps.length === 0) return null;
  
  const latest = stamps[0];
  return {
    date: latest.date,
    user: latest.user,
    isToday: isToday(parseISO(latest.date))
  };
}

export function createDateStamp(userName: string): string {
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  const displayDate = format(today, 'MMM dd, yyyy');
  const timeStr = format(today, 'HH:mm');
  
  return `
    <div class="date-stamp" data-date="${dateStr}" data-user="${userName}" style="
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      margin: 16px 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      border-left: 4px solid #1e40af;
    ">
      <span style="display: inline-flex; align-items: center; gap: 4px;">
        📅 ${displayDate} • ${timeStr}
      </span>
      <span style="opacity: 0.9; font-size: 12px;">
        by ${userName}
      </span>
    </div>
    <div style="margin-bottom: 16px;">
      <p><br></p>
    </div>
  `;
}

export function getContentWithoutDateStamps(content: string): string {
  return content.replace(/<div class="date-stamp"[^>]*>.*?<\/div>\s*<div[^>]*><p><br><\/p><\/div>/g, '');
}

export function formatRelativeDate(dateString: string): string {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM dd, yyyy');
  }
}