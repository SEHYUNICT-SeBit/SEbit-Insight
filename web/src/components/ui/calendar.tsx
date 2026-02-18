'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className={cn('p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((wd) => (
          <div key={wd} className="text-center text-xs text-muted-foreground py-1">
            {wd}
          </div>
        ))}
        {days.map((d, i) => {
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const isSelected = selected && isSameDay(d, selected);
          const isTodayDate = isToday(d);

          return (
            <button
              key={i}
              className={cn(
                'h-8 w-8 rounded-md text-sm flex items-center justify-center transition-colors',
                !isCurrentMonth && 'text-muted-foreground opacity-50',
                isCurrentMonth && 'hover:bg-accent',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                isTodayDate && !isSelected && 'bg-accent font-bold'
              )}
              onClick={() => onSelect?.(d)}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
