
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TIMETABLE, STATUS_COLORS, STATUS_LABELS, GAS_URL } from './constants';
import { Status, Period, SubjectStats, Action, GASResponse } from './types';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Slash, 
  Save, 
  RefreshCw, 
  Palmtree, 
  GraduationCap,
  BarChart3,
  MessageSquare,
  Check,
  UserCircle2,
  ChevronRight,
  BookOpen,
  ChevronDown,
  User,
  History,
  X,
  Sparkles,
  Wifi
} from 'lucide-react';

// Components
const StatusButton: React.FC<{ 
  status: Status; 
  isActive: boolean; 
  onClick: () => void 
}> = ({ status, isActive, onClick }) => {
  const getIcon = () => {
    switch (status) {
      case 'P': return <CheckCircle2 size={14} />;
      case 'A': return <XCircle size={14} />;
      case 'MB': return <AlertTriangle size={14} />;
      case 'NC': return <Slash size={14} />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 transform active:scale-95 flex-1 sm:flex-none sm:px-3 sm:py-1.5 sm:text-sm ${
        isActive 
          ? `${STATUS_COLORS[status]} shadow-lg shadow-${status === 'P' ? 'emerald' : status === 'A' ? 'rose' : 'amber'}-200/50 z-10 scale-[1.02]` 
          : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
      }`}
    >
      {getIcon()}
      {status}
    </button>
  );
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dayName, setDayName] = useState<string>('');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [stats, setStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showHolidayInput, setShowHolidayInput] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  // Derive unique subject list for dropdowns
  const ALL_SUBJECTS = useMemo(() => {
    const subjects = new Set<string>();
    Object.values(TIMETABLE).forEach(dayList => {
      dayList.forEach(sub => subjects.add(sub));
    });
    return Array.from(subjects).sort();
  }, []);

  // Determine Greeting based on time
  const greetingData = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    if (hour >= 17 && hour < 21) return { text: 'Good Evening', emoji: '🌆' };
    return { text: 'Good Night', emoji: '🌙' };
  }, [currentTime]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const callGAS = async <T,>(action: Action, data: any = null): Promise<GASResponse<T>> => {
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action, data }),
      });
      const result = await response.json();
      return result;
    } catch (e) {
      console.error(`GAS Error (${action}):`, e);
      return { success: false, error: 'Connection failed', data: null as any };
    }
  };

  const fetchStats = async () => {
    const res = await callGAS<SubjectStats[]>(Action.GET_SUBJECT_STATS);
    if (res.success) setStats(res.data);
  };

  const fetchLastDate = async () => {
    const res = await callGAS<string>(Action.GET_LAST_DATE);
    if (res.success && res.data) {
      const lastDate = new Date(res.data);
      lastDate.setDate(lastDate.getDate() + 1);
      setCurrentDate(lastDate.toISOString().split('T')[0]);
    }
  };

  const checkExistingAttendance = async (date: string) => {
    setLoading(true);
    setShowHolidayInput(false);
    setHolidayName('');
    const res = await callGAS<{ found: boolean, periods: Period[] }>(Action.CHECK_ATTENDANCE, date);
    if (res.success && res.data.found) {
      setPeriods(res.data.periods);
    } else {
      const d = new Date(date);
      const name = d.toLocaleDateString('en-US', { weekday: 'long' });
      const subjects = TIMETABLE[name] || [];
      setPeriods(subjects.map(sub => ({
        subject: sub,
        status: 'P' as Status,
        remark: ''
      })));
    }
    setLoading(false);
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    await fetchStats();
    await fetchLastDate();
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const d = new Date(currentDate);
    const name = d.toLocaleDateString('en-US', { weekday: 'long' });
    setDayName(name);
    checkExistingAttendance(currentDate);
  }, [currentDate]);

  const handleStatusChange = (index: number, status: Status) => {
    const newPeriods = [...periods];
    newPeriods[index].status = status;
    setPeriods(newPeriods);
  };

  const handleSubjectChange = (index: number, newSubject: string) => {
    const newPeriods = [...periods];
    newPeriods[index].subject = newSubject;
    setPeriods(newPeriods);
  };

  const handleRemarkChange = (index: number, remark: string) => {
    const newPeriods = [...periods];
    newPeriods[index].remark = remark;
    setPeriods(newPeriods);
  };

  const handleMarkAll = (status: Status) => {
    setPeriods(periods.map(p => ({ ...p, status })));
    if (status === 'NC') {
      setShowHolidayInput(true);
    } else {
      setShowHolidayInput(false);
      setHolidayName('');
    }
  };

  const handleHolidayNameUpdate = (val: string) => {
    setHolidayName(val);
    setPeriods(prev => prev.map(p => ({
      ...p,
      remark: p.status === 'NC' ? val : p.remark
    })));
  };

  const handleSave = async () => {
    if (periods.length === 0) return;
    setSaving(true);
    setMessage(null);
    const res = await callGAS<boolean>(Action.SAVE_ATTENDANCE, { date: currentDate, dayName, periods });
    if (res.success) {
      setMessage({ type: 'success', text: 'Records synced with cloud' });
      await fetchStats();
    } else {
      setMessage({ type: 'error', text: 'Sync failed' });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      {/* Optimized Premium Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform duration-300 ring-2 ring-indigo-50">
                <GraduationCap className="text-white" size={24} />
              </div>
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                Attendance<span className="text-indigo-600">Buddy</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Cloud Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Clock Indicator Widget (Hidden on mobile as it's now in the name label) */}
            <div className="hidden lg:flex items-center gap-3 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg shadow-slate-200 border border-slate-800">
              <Clock size={16} className="text-indigo-400" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Global Clock</span>
                <span className="text-sm font-bold tabular-nums">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>

            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="group flex items-center gap-2 p-1 pr-3 sm:pr-5 bg-white border border-slate-200 rounded-full hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/40 transition-all duration-300 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-white border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105">
                  <UserCircle2 size={24} />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate max-w-[60px] sm:max-w-none">Pabitra</span>
                  {/* Real-time Clock under Name */}
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter tabular-nums flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-300 ml-1 transition-transform duration-300 ${showProfile ? 'rotate-180' : ''}`} />
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-6 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
    
                  
                  <div className="px-6 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={24} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-base font-bold text-slate-800 leading-none">Pabitra Khandual</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Roll & Reg. No: 25CHE21</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 space-y-1">
                    <div className="px-3 py-3 flex items-center gap-3 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Time :</span>
                        <span className="text-xs font-bold tabular-nums text-slate-700">
                          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </div>
                    
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        
        {/* ENHANCED Personalized Greeting Section */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white border border-white shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 z-0"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-40 z-0"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 rounded-full flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Attendance Dashboard</span>
                </div>
                <div className="h-1 w-8 bg-slate-100 rounded-full"></div>
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                {greetingData.text} 
                <span className="inline-block animate-bounce duration-[3000ms] mx-2 sm:mx-3 origin-bottom">
                  {greetingData.emoji}
                </span>
                <br className="sm:hidden" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                   Pabitra Khandual
                </span>
              </h2>
              
              <p className="text-sm sm:text-base font-medium text-slate-500 max-w-md">
                You have <span className="text-indigo-600 font-bold">{periods.length} sessions</span> listed for today's curriculum. Let's make them count!
              </p>
            </div>

            
          </div>
        </div>

        {/* Main Attendance Card */}
        <section className="glass-card rounded-[1.5rem] sm:rounded-[2rem] shadow-xl sm:shadow-2xl shadow-indigo-100/50 overflow-hidden relative border border-white">
          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-30 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <p className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">Fetching...</p>
              </div>
            </div>
          )}
          
          <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50/30 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 border-b border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-[70%] sm:w-[180px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                <input 
                  type="date" 
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                />
              </div>
              <div className="w-[30%] sm:w-auto px-2 py-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 flex items-center justify-center shrink-0">
                <span className="text-[10px] sm:text-xs font-bold tracking-wide truncate">{dayName}</span>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              <button onClick={() => handleMarkAll('NC')} className="flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-2 bg-slate-100 text-slate-600 rounded-lg whitespace-nowrap flex-1 sm:flex-none">
                <Palmtree size={12} className="text-orange-400" /> Holiday
              </button>
              <button onClick={() => handleMarkAll('P')} className="flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg whitespace-nowrap flex-1 sm:flex-none">
                <CheckCircle2 size={12} /> All P
              </button>
              <button onClick={() => handleMarkAll('A')} className="flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-2 bg-rose-50 text-rose-600 rounded-lg whitespace-nowrap flex-1 sm:flex-none">
                <XCircle size={12} /> All A
              </button>
            </div>
          </div>

          {showHolidayInput && (
            <div className="px-4 sm:px-8 pt-4 sm:pt-6 animate-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 flex-1 w-full">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Palmtree size={20} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">Holiday Name :</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={holidayName}
                        onChange={(e) => handleHolidayNameUpdate(e.target.value)}
                        placeholder="e.g. Diwali, Holi, Sunday..."
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-50 transition-all shadow-sm"
                        autoFocus
                      />
                      {holidayName && (
                        <button onClick={() => handleHolidayNameUpdate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            {periods.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm font-medium">No periods scheduled for today.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {periods.map((period, idx) => (
                  <div key={idx} className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {idx + 1}
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                          {period.subject}
                        </h3>
                      </div>

                      <div className="relative group/dropdown shrink-0">
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer min-w-[90px] sm:min-w-[120px] justify-between shadow-sm shadow-indigo-50 group-active/dropdown:scale-95">
                          <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-indigo-500" />
                            <span className="inline">Swap</span>
                          </div>
                          <ChevronDown size={14} className="text-indigo-400 group-hover/dropdown:text-indigo-600 transition-colors" />
                          <select 
                            value={period.subject}
                            onChange={(e) => handleSubjectChange(idx, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          >
                            <optgroup label="Modify Period Subject">
                              {ALL_SUBJECTS.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-1.5">
                        {(['P', 'A', 'MB', 'NC'] as Status[]).map((s) => (
                          <StatusButton 
                            key={s} 
                            status={s} 
                            isActive={period.status === s} 
                            onClick={() => handleStatusChange(idx, s)}
                          />
                        ))}
                      </div>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input 
                          type="text" 
                          placeholder="Add a remark..."
                          value={period.remark}
                          onChange={(e) => handleRemarkChange(idx, e.target.value)}
                          className={`w-full pl-9 pr-4 py-2.5 text-xs font-medium border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all ${
                            period.status === 'NC' && holidayName ? 'bg-amber-50/30' : 'bg-slate-50/30'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 sm:px-8 py-6 bg-slate-50/80 border-t border-slate-100">
            <div className="flex flex-col gap-4">
              {message && (
                <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${
                  message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                } animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm`}>
                  {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                  {message.text}
                </div>
              )}
              
              <button
                onClick={handleSave}
                disabled={saving || periods.length === 0 || loading}
                className="w-full relative group overflow-hidden py-5 sm:py-5 bg-indigo-600 text-white font-bold rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {saving ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    <span>Processing Cloud Sync...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Statistics Dashboard */}
        <section className="glass-card rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border border-white overflow-hidden">
          <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600">
                <BarChart3 size={18} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Performance Analytics</h2>
            </div>
            <button 
              onClick={fetchStats}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          
          <div className="p-4 sm:p-8 space-y-3 sm:space-y-4">
            {stats.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm font-medium italic">
                Analytics will update once you save your attendance.
              </div>
            ) : (
              stats.map((row, i) => (
                <div key={i} className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-100 flex flex-col gap-4 hover:shadow-lg hover:shadow-indigo-50/40 transition-shadow group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{row.subject}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Subject Attendance</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm sm:text-base font-bold px-3 py-1 rounded-xl ${row.percentage >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {row.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          row.percentage >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 to-rose-600'
                        }`}
                        style={{ width: `${row.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex gap-5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                          <span className="text-[10px] font-bold text-slate-500">P: {row.present}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm"></div>
                          <span className="text-[10px] font-bold text-slate-500">A: {row.absent}</span>
                        </div>
                        {row.massBunk > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></div>
                            <span className="text-[10px] font-bold text-slate-500">MB: {row.massBunk}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">Classes: {row.total}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center gap-3 opacity-40">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">AttendanceBuddy</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[9px] font-semibold text-slate-400 text-center uppercase tracking-tight">Made with love by</p>
          <p className="text-[9px] font-bold text-slate-500 text-center uppercase tracking-tighter">Pabitra Khandual</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
