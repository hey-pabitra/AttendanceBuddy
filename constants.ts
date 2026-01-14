
export const TIMETABLE: Record<string, string[]> = {
  'Monday': ['MATH-1', 'ETW', 'BE', 'CHEM', 'BME', 'EM'],
  'Tuesday': ['BE-LAB', 'ETW-LAB'],
  'Wednesday': ['MATH-1', 'CHEM', 'BE', 'WORKSHOP'],
  'Thursday': ['BME', 'CHEM', 'EM', 'CHEM-LAB'],
  'Friday': ['BME', 'MATH-1', 'BE', 'ETW', 'CHEM', 'EM'],
  'Saturday': ['TC/HSC', 'S/Y/N/C']
};

export const STATUS_COLORS: Record<string, string> = {
  P: 'bg-emerald-500 text-white',
  A: 'bg-rose-500 text-white',
  MB: 'bg-amber-500 text-white',
  NC: 'bg-slate-400 text-white'
};

export const STATUS_LABELS: Record<string, string> = {
  P: 'Present',
  A: 'Absent',
  MB: 'Mass Bunk',
  NC: 'No Class'
};

// Replace with your actual deployed Google Apps Script URL
export const GAS_URL = 'https://script.google.com/macros/s/AKfycbzRzf7vb1HlzixpvI2ml_1iKQOOyHMMYK2u4ZSNovaBWQfQ7hb0JdBJR3IV7vE2Mao9rw/exec';
