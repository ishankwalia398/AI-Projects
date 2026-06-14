import React, { useState, useEffect } from 'react';
import { User, Interview, JobApplication } from '../types';
import { dbGetAllInterviews } from '../lib/db';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Video, MapPin, Clock, ArrowRight } from 'lucide-react';

interface CalendarViewProps {
  user: User;
  onJobClick: (id: string) => void;
  applications: JobApplication[];
}

export function CalendarView({ user, onJobClick, applications }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [interviews, setInterviews] = useState<(Interview & { company: string; role: string })[]>([]);

  useEffect(() => {
    dbGetAllInterviews(user.username).then(setInterviews);
  }, [user.username, applications]);

  // Calendar Math Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const calendarCells = [];

  // 1. Previous Month filler cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateString: `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}`
    });
  }

  // 2. Current Month cells
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  // 3. Next month filler cells to complete 42-grid length
  const totalCellsNeeded = 42;
  const nextMonthFillerCount = totalCellsNeeded - calendarCells.length;
  for (let i = 1; i <= nextMonthFillerCount; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      dateString: `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getInterviewsForDate = (dateString: string) => {
    return interviews.filter((i) => i.date === dateString);
  };

  // Format month title
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-4" id="calendar-view">
      {/* Upper header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#DFE1E6]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D] font-sans">
            Schedules & Reminders
          </h1>
          <p className="text-[#5E6C84] text-xs mt-0.5">
            Track interview dates, technical round timelines, and general follow-up deadlines chronologically.
          </p>
        </div>

        {/* Calendar Navbuttons */}
        <div className="flex items-center gap-2 bg-white border border-[#DFE1E6] p-1 rounded premium-shadow shrink-0 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 bg-[#FAFBFC] border border-[#DFE1E6] hover:bg-[#F4F5F7] text-[#42526E] rounded cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-xs text-[#172B4D] min-w-28 text-center select-none font-sans">
            {monthName} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 bg-[#FAFBFC] border border-[#DFE1E6] hover:bg-[#F4F5F7] text-[#42526E] rounded cursor-pointer transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid lg:grid-cols-4 gap-4">
        
        {/* Main 42-cell Month-Grid Calendar (3 cols on Desktop) */}
        <div className="lg:col-span-3 bg-white border border-[#DFE1E6] rounded premium-shadow overflow-hidden">
          
          {/* Weekday indicator labels */}
          <div className="grid grid-cols-7 text-center py-1.5 bg-[#FAFBFC] border-b border-[#DFE1E6] text-[9px] font-bold text-[#5E6C84] uppercase tracking-wider font-sans">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid rows */}
          <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr divide-x divide-y divide-[#EBECF0]">
            {calendarCells.map((cell, idx) => {
              const dayInterviews = getInterviewsForDate(cell.dateString);
              const isToday = new Date().toISOString().split('T')[0] === cell.dateString;

              return (
                <div
                  key={idx}
                  className={`min-h-[64px] sm:min-h-[85px] p-1 sm:p-1.5 flex flex-col justify-between transition-colors relative ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-[#FAFBFC] text-slate-400'
                  }`}
                >
                  {/* Day marker label */}
                  <span className={`font-mono text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-[#E3F2FD] text-[#0747A6] font-extrabold' : 'text-[#5E6C84]'
                  }`}>
                    {cell.day}
                  </span>

                  {/* Day items container list */}
                  <div className="mt-1 space-y-1 grow overflow-y-auto max-h-12 pr-1 custom-scroll">
                    {dayInterviews.map((int) => (
                      <button
                        key={int.id}
                        onClick={() => onJobClick(int.applicationId)}
                        className="w-full text-left p-1 bg-[#E3F2FD] hover:bg-[#E3F2FD]/80 border border-blue-200 rounded text-[9px] font-bold text-[#0747A6] flex flex-col gap-0.5 transition-colors cursor-pointer truncate shadow-2xs"
                        title={`${int.company} - ${int.role}`}
                      >
                        <div className="truncate font-bold text-[8px] uppercase tracking-wide leading-none">{int.round} Round</div>
                        <div className="truncate text-[8px] font-semibold leading-none mt-0.5 text-blue-800">{int.company}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar panels: Upcoming events feed listing items */}
        <div className="bg-white p-4 rounded border border-[#DFE1E6] premium-shadow h-fit space-y-3.5">
          <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-[#5E6C84]" />
            Active Schedulers
          </h3>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {interviews.length === 0 ? (
              <div className="text-center text-[#5E6C84] py-8 text-xs">
                No active interview events or round schedules logged currently.
              </div>
            ) : (
              interviews.map((int) => (
                <div
                  key={int.id}
                  onClick={() => onJobClick(int.applicationId)}
                  className="p-2.5 bg-[#FAFBFC] hover:bg-[#E3F2FD]/30 border border-[#DFE1E6] hover:border-blue-400 rounded transition-all duration-155 cursor-pointer text-xs space-y-1.5 group"
                >
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="font-bold text-[#172B4D] text-xs group-hover:text-blue-600">{int.role}</h4>
                      <p className="text-[10px] font-semibold text-[#5E6C84] mt-0.5">{int.company}</p>
                    </div>
                    <span className="shrink-0 px-1.5 py-0.5 text-[8px] bg-[#091E42] font-mono text-white font-bold rounded uppercase tracking-wider">
                      {int.round}
                    </span>
                  </div>

                  <div className="space-y-1 text-[9.5px] text-[#5E6C84] font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 inline text-[#A5ADBA] shrink-0" />
                      <span>{new Date(int.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {int.time || 'TBD'}</span>
                    </div>

                    {int.mode && (
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3 inline text-[#A5ADBA] shrink-0" />
                        <span>{int.mode} {int.link && <span className="text-blue-600 shrink-0 underline">(Join Meet)</span>}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
