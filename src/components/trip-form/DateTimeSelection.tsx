
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateTimeSelectionProps {
  date: Date;
  setDate: (date: Date) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
}

const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({
  date,
  setDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime
}) => {
  return (
    <>
      {/* 날짜 선택 - default today */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          운행 날짜
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "yyyy년 MM월 dd일", { locale: ko }) : "날짜를 선택하세요"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 시간 입력 - with defaults */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            입차시간
          </Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            출차시간
          </Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </>
  );
};

export default DateTimeSelection;
