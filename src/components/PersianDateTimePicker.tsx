import React, { useState } from 'react';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAYS,
  getDaysInJalaliMonth,
  getJalaliMonthFirstDayOfWeek,
  getCurrentJalali,
  toPersianDigits
} from '../utils/persianDate';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  RotateCcw
} from 'lucide-react';

interface PersianDateTimePickerModalProps {
  initialValue?: string; // e.g. "۱۴۰۳/۰۶/۲۹" or "1403/06/29 - 14:30"
  onSelect: (formattedDate: string) => void;
  onClose: () => void;
  includeTime?: boolean;
  title?: string;
}

export const PersianDateTimePickerModal: React.FC<PersianDateTimePickerModalProps> = ({
  initialValue,
  onSelect,
  onClose,
  includeTime = true,
  title = 'انتخاب تاریخ و ساعت (تقویم شمسی)'
}) => {
  const current = getCurrentJalali();

  // Try parsing initial Jalali year/month/day if provided
  let initYear = current.year;
  let initMonth = current.month;
  let initDay = current.day;
  let initHour = current.hour;
  let initMinute = Math.floor(current.minute / 5) * 5;

  if (initialValue) {
    const matches = initialValue.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (matches) {
      initYear = parseInt(matches[1], 10);
      initMonth = parseInt(matches[2], 10);
      initDay = parseInt(matches[3], 10);
    }
    const timeMatch = initialValue.match(/(\d{1,2}):(\d{1,2})/);
    if (timeMatch) {
      initHour = parseInt(timeMatch[1], 10);
      initMinute = parseInt(timeMatch[2], 10);
    }
  }

  const [selectedYear, setSelectedYear] = useState<number>(initYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initMonth);
  const [selectedDay, setSelectedDay] = useState<number>(initDay);
  const [selectedHour, setSelectedHour] = useState<number>(initHour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initMinute);

  const daysInMonth = getDaysInJalaliMonth(selectedYear, selectedMonth);
  const startDayOfWeek = getJalaliMonthFirstDayOfWeek(selectedYear, selectedMonth);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleSelectToday = () => {
    setSelectedYear(current.year);
    setSelectedMonth(current.month);
    setSelectedDay(current.day);
    setSelectedHour(current.hour);
    setSelectedMinute(Math.floor(current.minute / 5) * 5);
  };

  const handleAddDays = (daysToAdd: number) => {
    let d = selectedDay + daysToAdd;
    let m = selectedMonth;
    let y = selectedYear;
    while (d > getDaysInJalaliMonth(y, m)) {
      d -= getDaysInJalaliMonth(y, m);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
  };

  const handleConfirm = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    let result = `${selectedYear}/${pad(selectedMonth)}/${pad(selectedDay)}`;
    if (includeTime) {
      result += ` - ساعت ${pad(selectedHour)}:${pad(selectedMinute)}`;
    }
    onSelect(result);
    onClose();
  };

  // Generate calendar cells (blanks + days)
  const calendarCells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <CalendarIcon className="w-4 h-4" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month & Year Navigation */}
        <div className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="ماه بعد"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="font-bold text-white text-sm">
              {PERSIAN_MONTH_NAMES[selectedMonth - 1]}
            </span>{' '}
            <span className="font-mono text-cyan-400 font-bold text-sm">
              {toPersianDigits(selectedYear)}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="ماه قبل"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 border-b border-slate-800/60 pb-1">
          {PERSIAN_WEEKDAYS.map((w, i) => (
            <div
              key={i}
              className={`py-1 ${i === 6 ? 'text-rose-400 font-bold' : ''}`}
            >
              {w.short}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`blank-${idx}`} className="h-8"></div>;
            }

            const isSelected = selectedDay === day;
            const isToday =
              current.year === selectedYear &&
              current.month === selectedMonth &&
              current.day === day;
            const isFriday = (idx % 7) === 6;

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center font-bold transition ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300'
                    : isToday
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                    : isFriday
                    ? 'text-rose-400 hover:bg-slate-800/80'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {toPersianDigits(day)}
              </button>
            );
          })}
        </div>

        {/* Time Selection */}
        {includeTime && (
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>انتخاب ساعت و دقیقه:</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">ساعت:</span>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')} ({toPersianDigits(h)})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-500 font-bold">:</span>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">دقیقه:</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(parseInt(e.target.value, 10))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')} ({toPersianDigits(m)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Quick shortcut buttons */}
        <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={handleSelectToday}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
          >
            امروز ({toPersianDigits(current.day)} {PERSIAN_MONTH_NAMES[current.month - 1]})
          </button>
          <button
            type="button"
            onClick={() => handleAddDays(1)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          >
            +۱ روز
          </button>
          <button
            type="button"
            onClick={() => handleAddDays(7)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          >
            +۷ روز
          </button>
          <button
            type="button"
            onClick={() => handleAddDays(14)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          >
            +۱۴ روز
          </button>
        </div>

        {/* Action Confirm Button */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            تایید تاریخ و ساعت
          </button>
        </div>

      </div>
    </div>
  );
};

interface PersianDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  includeTime?: boolean;
  required?: boolean;
  className?: string;
}

export const PersianDateInput: React.FC<PersianDateInputProps> = ({
  value,
  onChange,
  label,
  placeholder = 'انتخاب تاریخ و ساعت...',
  includeTime = true,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen(true)}
        className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500/70 rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between cursor-pointer transition shadow-sm group"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
          <span className={value ? 'text-white font-mono' : 'text-slate-500'}>
            {value || placeholder}
          </span>
        </div>
        <span className="text-[10px] text-cyan-400/80 group-hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
          تقویم شمسی
        </span>
      </div>

      {isOpen && (
        <PersianDateTimePickerModal
          initialValue={value}
          includeTime={includeTime}
          onSelect={(selectedVal) => {
            onChange(selectedVal);
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
