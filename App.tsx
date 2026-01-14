
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
  Wifi,
  LayoutDashboard
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
    <div className="min-h-screen pb-12 bg-[#F8FAFF]">
      {/* PREMIUM NAVIGATION HEADER */}
      <nav className="bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-all duration-300 ring-4 ring-indigo-50">
                <GraduationCap className="text-white" size={24} />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-none">
                <span className="text-slate-900">Attendance</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Buddy</span>
              </h1>
              <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Cloud Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="group flex items-center gap-3 p-1 pr-3 sm:pr-5 bg-white border border-slate-200 rounded-full hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-50 to-white border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 group-hover:rotate-12 transition-transform">
                  <UserCircle2 size={24} />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold text-slate-800 truncate">Pabitra</span>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tight tabular-nums flex items-center gap-1">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-300 ml-1 transition-transform duration-300 ${showProfile ? 'rotate-180 text-indigo-500' : ''}`} />
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-6 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="px-6 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-400">
                        <User size={24} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-extrabold text-slate-800">Pabitra Khandual</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reg: 25CHE21</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-50 pt-4 px-3 space-y-1">
                    <div className="px-4 py-3 flex items-center gap-3 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer">
                      <Clock size={16} className="text-indigo-500" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Current Time</span>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 sm:mt-10 space-y-8 sm:space-y-12">
        
        {/* ENHANCED HERO WELCOME SECTION */}
        <section className="relative overflow-hidden p-8 sm:p-12 rounded-[2.5rem] bg-white border border-white shadow-xl shadow-indigo-100/30 animate-in fade-in slide-in-from-top-4 duration-700">
          {/* Visual Background Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl z-0"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-60 h-60 bg-violet-100/30 rounded-full blur-3xl z-0"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full shadow-sm">
                <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Welcome Back</span>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                  {greetingData.text} 
                  <span className="inline-block animate-bounce duration-[3000ms] mx-3 origin-bottom drop-shadow-sm">
                    {greetingData.emoji}
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500">
                    Pabitra Khandual
                  </span>
                </h2>
                
                <p className="text-sm sm:text-lg font-medium text-slate-500 leading-relaxed">
                  Your curriculum shows <span className="text-indigo-600 font-black px-1.5 py-0.5 bg-indigo-50 rounded-lg">{periods.length} mandatory sessions</span> for today. Let's keep that streak alive!
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="w-48 h-48 rounded-[3rem] bg-indigo-50 flex items-center justify-center relative border-4 border-white shadow-2xl">
                <div className="absolute inset-4 rounded-[2rem] bg-indigo-100 animate-pulse opacity-40"></div>
                <div className="relative flex flex-col items-center">
                  <span className="text-5xl font-black text-indigo-600 leading-none">{periods.length}</span>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Periods</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Attendance Controls Card */}
        <section className="glass-card rounded-[2rem] shadow-2xl shadow-indigo-100/50 overflow-hidden relative border border-white">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-30 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg"></div>
                <p className="text-[10px] font-black text-indigo-600 tracking-widest uppercase animate-pulse">Establishing Connection...</p>
              </div>
            </div>
          )}
          
          <div className="p-5 sm:p-8 bg-gradient-to-br from-indigo-50/40 via-white to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-[70%] sm:w-[200px]">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                <input 
                  type="date" 
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                />
              </div>
              <div className="w-[30%] sm:w-auto px-4 py-3 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200 flex items-center justify-center shrink-0">
                <span className="text-xs font-black tracking-widest uppercase">{dayName.slice(0,3)}</span>
              </div>
            </div>

            <div className="flex gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              <button onClick={() => handleMarkAll('NC')} className="flex items-center justify-center gap-2 text-[10px] font-black px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl whitespace-nowrap flex-1 sm:flex-none hover:bg-slate-200 transition-colors">
                <Palmtree size={14} className="text-orange-500" /> HOLIDAY
              </button>
              <button onClick={() => handleMarkAll('P')} className="flex items-center justify-center gap-2 text-[10px] font-black px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl whitespace-nowrap flex-1 sm:flex-none hover:bg-emerald-100 transition-colors">
                <CheckCircle2 size={14} /> ALL P
              </button>
              <button onClick={() => handleMarkAll('A')} className="flex items-center justify-center gap-2 text-[10px] font-black px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl whitespace-nowrap flex-1 sm:flex-none hover:bg-rose-100 transition-colors">
                <XCircle size={14} /> ALL A
              </button>
            </div>
          </div>

          {showHolidayInput && (
            <div className="px-5 sm:px-8 pt-6 animate-in slide-in-from-top-2 duration-300">
              <div className="p-5 bg-amber-50/60 border border-amber-200/50 rounded-3xl flex flex-col sm:flex-row items-center gap-5">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                    <Palmtree size={24} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1.5">Holiday Reason</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={holidayName}
                        onChange={(e) => handleHolidayNameUpdate(e.target.value)}
                        placeholder="Why is it a holiday?"
                        className="w-full pl-5 pr-12 py-3 bg-white border border-amber-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-100/50 transition-all"
                        autoFocus
                      />
                      {holidayName && (
                        <button onClick={() => handleHolidayNameUpdate('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-8 space-y-5 sm:space-y-8">
            {periods.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                  <Calendar size={40} />
                </div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No curriculum scheduled for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
                {periods.map((period, idx) => (
                  <div key={idx} className="p-5 sm:p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-5 gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          {idx + 1}
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-sm sm:text-base truncate group-hover:text-indigo-600 transition-colors">
                          {period.subject}
                        </h3>
                      </div>

                      <div className="relative group/dropdown shrink-0">
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer min-w-[110px] justify-between">
                          <BookOpen size={14} className="opacity-60" />
                          <span>SWAP</span>
                          <ChevronDown size={14} className="opacity-40" />
                          <select 
                            value={period.subject}
                            onChange={(e) => handleSubjectChange(idx, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          >
                            <optgroup label="Change Subject">
                              {ALL_SUBJECTS.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
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
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input 
                          type="text" 
                          placeholder="Note for this session..."
                          value={period.remark}
                          onChange={(e) => handleRemarkChange(idx, e.target.value)}
                          className={`w-full pl-10 pr-5 py-3 text-xs font-bold border border-slate-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all ${
                            period.status === 'NC' && holidayName ? 'bg-amber-50/40 border-amber-100' : 'bg-slate-50/50'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 sm:px-8 py-8 bg-slate-50/50 border-t border-slate-100">
            <div className="flex flex-col gap-5">
              {message && (
                <div className={`flex items-center justify-center gap-3 px-5 py-4 rounded-2xl text-xs font-black tracking-wide ${
                  message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                } animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm`}>
                  {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                  {message.text.toUpperCase()}
                </div>
              )}
              
              <button
                onClick={handleSave}
                disabled={saving || periods.length === 0 || loading}
                className="w-full relative group overflow-hidden py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl shadow-slate-300 hover:bg-indigo-600 disabled:bg-slate-300 disabled:shadow-none transition-all duration-500 flex items-center justify-center gap-4 active:scale-95 uppercase tracking-widest"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {saving ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    <span>Syncing Attendance...</span>
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

        {/* Analytics Dashboard */}
        <section className="glass-card rounded-[2rem] shadow-xl border border-white overflow-hidden mb-12">
          <div className="p-6 sm:p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Attendance Analytics</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Live Subject Tracking</p>
              </div>
            </div>
            <button 
              onClick={fetchStats}
              className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden sm:inline">Reload Data</span>
            </button>
          </div>
          
          <div className="p-5 sm:p-10 space-y-5 sm:space-y-8">
            {stats.length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                  <BarChart3 size={40} />
                </div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Dashboard is empty. Start marking attendance to see trends.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 sm:gap-6">
                {stats.map((row, i) => (
                  <div key={i} className="p-6 sm:p-8 rounded-[2.5rem] bg-white border border-slate-50 flex flex-col gap-6 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <GraduationCap size={120} />
                    </div>
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <h4 className="font-black text-slate-800 text-lg sm:text-xl group-hover:text-indigo-600 transition-colors">{row.subject}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{row.total} Total Classes</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl sm:text-3xl font-black tabular-nums tracking-tighter ${row.percentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {row.percentage}%
                        </span>
                        <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${row.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {row.percentage >= 75 ? 'On Track' : 'Warning'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                            row.percentage >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'
                          }`}
                          style={{ width: `${row.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between px-2">
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Present: {row.present}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Absent: {row.absent}</span>
                          </div>
                          {row.massBunk > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bunked: {row.massBunk}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-16 flex flex-col items-center gap-5 opacity-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
            <GraduationCap size={16} className="text-slate-500" />
          </div>
          <span className="text-xs font-black text-slate-800 tracking-[0.4em] uppercase">AttendanceBuddy</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">Architected for Academic Attendance</p>
          <p className="text-[10px] font-black text-slate-600 text-center uppercase tracking-[0.2em]">Pabitra Khandual • 25CHE21 • v2.1.15</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
