/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Home as HomeIcon, 
  Timer, 
  BarChart2, 
  TrendingUp, 
  User, 
  Settings, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  Droplets, 
  Moon, 
  Utensils, 
  Dumbbell,
  Flag,
  ChevronRight,
  Star,
  MessageCircle,
  Image as ImageIcon,
  Send,
  Loader2,
  X,
  Plus,
  Bell,
  Sparkles,
  Share2,
  MessageSquare,
  AtSign,
  Link as LinkIcon,
  ShieldCheck,
  ExternalLink,
  Smile,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { chatWithGemini, generateWellnessImage } from './services/geminiService';
import { translations, type Language } from './translations';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Screen = 'home' | 'tracker' | 'goals' | 'assess' | 'insights' | 'feedback' | 'chat' | 'image-gen';

interface Habit {
  id: string;
  name: string;
  iconName: string;
  type: 'checkbox' | 'numeric';
  goal?: number;
  current?: number;
  completed: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  timer: <Timer size={18} />,
  utensils: <Utensils size={18} />,
  dumbbell: <Dumbbell size={18} />,
  droplets: <Droplets size={18} />,
  moon: <Moon size={18} />,
  zap: <Zap size={18} />,
  star: <Star size={18} />,
  smile: <Smile size={18} />,
  heart: <CheckCircle2 size={18} />,
  activity: <TrendingUp size={18} />,
};

// --- Components ---

const TopBar = ({ title, onSettings }: { title: string; onSettings?: () => void }) => (
  <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface-container-low/80 backdrop-blur-xl border-b border-outline/5">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant ring-2 ring-primary/10">
        <img 
          alt="User profile" 
          className="w-full h-full object-cover" 
          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100" 
          referrerPolicy="no-referrer"
        />
      </div>
      <h1 className="font-headline font-extrabold text-primary tracking-tighter text-lg">{title}</h1>
    </div>
    <div className="flex items-center gap-2">
      <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors active:scale-95">
        <Bell size={20} />
      </button>
      <button 
        onClick={onSettings}
        className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors active:scale-95"
      >
        <Settings size={20} />
      </button>
    </div>
  </header>
);

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  currentLanguage, 
  onLanguageChange,
  t 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  currentLanguage: Language; 
  onLanguageChange: (lang: Language) => void;
  t: any;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-2xl border border-outline/5"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline text-2xl font-bold">{t.feedback}</h3>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-outline ml-1">Language / ภาษา</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'en', label: 'English', sub: 'Default' },
                  { id: 'th', label: 'ไทย', sub: 'ภาษาไทย' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      onLanguageChange(lang.id as Language);
                      onClose();
                    }}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      currentLanguage === lang.id 
                        ? "bg-primary/5 border-primary text-primary" 
                        : "bg-surface-container-low border-transparent text-on-surface-variant hover:border-outline/20"
                    )}
                  >
                    <div className="text-left">
                      <p className="font-bold text-lg">{lang.label}</p>
                      <p className="text-xs opacity-60">{lang.sub}</p>
                    </div>
                    {currentLanguage === lang.id && <CheckCircle2 size={24} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            Done
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const BottomNav = ({ active, onChange, t }: { active: Screen; onChange: (s: Screen) => void; t: any }) => {
  const navItems: { id: Screen; label: string; icon: any }[] = [
    { id: 'home', label: t.home, icon: HomeIcon },
    { id: 'tracker', label: t.tracker, icon: Timer },
    { id: 'goals', label: t.goals, icon: User },
    { id: 'assess', label: t.assess, icon: BarChart2 },
    { id: 'insights', label: t.insights, icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)] border-t border-outline/5">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "flex flex-col items-center justify-center px-4 py-1 rounded-2xl transition-all duration-300",
            active === item.id ? "text-primary bg-secondary-container/30 scale-100" : "text-outline opacity-60 hover:opacity-100 scale-90"
          )}
        >
          <item.icon size={20} strokeWidth={active === item.id ? 2.5 : 2} />
          <span className="font-body text-[10px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- Screen Components ---

const HomeScreen = ({ onBegin, t }: { onBegin: () => void; t: any; key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="pt-20 pb-32 px-6 space-y-8"
  >
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold tracking-widest uppercase">
        <span>{t.program12Week}</span>
      </div>
      <h2 className="font-headline text-4xl font-bold text-on-surface leading-tight">
        {t.heroTitle} <span className="text-primary">{t.heroStartsHere}</span>
      </h2>
      <p className="text-on-surface-variant text-lg leading-relaxed">
        {t.heroDesc}
      </p>
    </div>

    <div className="relative h-72 w-full rounded-2xl overflow-hidden shadow-xl">
      <img 
        alt="Yoga pose" 
        className="w-full h-full object-cover" 
        src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800" 
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
      <div className="absolute bottom-6 left-6">
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-sm font-semibold text-primary">Daily Focus</p>
          <p className="text-xs text-on-surface-variant">Morning Vitality Session</p>
        </div>
      </div>
    </div>

    <button 
      onClick={onBegin}
      className="group w-full py-5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
    >
      <span>{t.beginJourney}</span>
      <ArrowRight className="group-hover:translate-x-1 transition-transform" />
    </button>
    <p className="text-center text-xs text-outline font-medium tracking-wide">{t.noCreditCard}</p>

    <div className="space-y-6">
      <h3 className="font-headline text-xl font-bold">{t.howItWorks}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-surface-container-low p-6 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <Timer className="text-primary" size={24} />
            <h4 className="font-bold text-lg">{t.smartTracking}</h4>
            <p className="text-sm text-on-surface-variant">{t.smartTrackingDesc}</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/5 shadow-sm flex flex-col justify-between h-40">
          <BarChart2 className="text-secondary" size={24} />
          <div>
            <h4 className="font-bold text-base">{t.healthMetrics}</h4>
            <p className="text-xs text-on-surface-variant">{t.healthMetricsDesc}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/5 shadow-sm flex flex-col justify-between h-40">
          <TrendingUp className="text-primary-container" size={24} />
          <div>
            <h4 className="font-bold text-base">{t.weeklyInsights}</h4>
            <p className="text-xs text-on-surface-variant">{t.weeklyInsightsDesc}</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-tertiary-fixed rounded-2xl p-8 relative overflow-hidden">
      <p className="relative z-10 text-on-surface font-medium italic text-lg leading-relaxed">
        {t.testimonial}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
          JS
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">Julia S.</p>
          <p className="text-xs text-on-surface-variant">Member since Week 4</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const TrackerScreen = ({ t }: { t: any; key?: string }) => {
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: t.fasting168, iconName: 'timer', completed: true, type: 'checkbox' },
    { id: '2', name: t.noSnacking, iconName: 'utensils', completed: true, type: 'checkbox' },
    { id: '3', name: t.lowCarbSugar, iconName: 'utensils', completed: true, type: 'checkbox' },
    { id: '4', name: t.physicalActivity, iconName: 'dumbbell', completed: false, type: 'checkbox' },
    { id: '5', name: t.hydration, iconName: 'droplets', completed: true, type: 'numeric', goal: 8, current: 8 },
    { id: '6', name: t.qualitySleep, iconName: 'moon', completed: true, type: 'checkbox' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        if (h.type === 'checkbox') {
          return { ...h, completed: !h.completed };
        } else {
          const newCurrent = (h.current || 0) >= (h.goal || 1) ? 0 : (h.current || 0) + 1;
          return { ...h, current: newCurrent, completed: newCurrent >= (h.goal || 1) };
        }
      }
      return h;
    }));
  };

  const handleSaveHabit = (habitData: Omit<Habit, 'completed' | 'current'>) => {
    if (habitData.id) {
      setHabits(habits.map(h => h.id === habitData.id ? { 
        ...h, 
        ...habitData,
        completed: h.type === 'numeric' ? (h.current || 0) >= (habitData.goal || 1) : h.completed
      } : h));
    } else {
      const newHabit: Habit = {
        ...habitData,
        id: Math.random().toString(36).substr(2, 9),
        completed: false,
        current: habitData.type === 'numeric' ? 0 : undefined
      };
      setHabits([...habits, newHabit]);
    }
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const completedCount = habits.filter(h => h.completed).length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 pb-32 px-6 space-y-8"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="font-headline font-bold text-3xl tracking-tight">{t.dailyTracker}</h2>
          <p className="text-on-surface-variant text-sm">{t.trackerDesc}</p>
        </div>
        <button 
          onClick={() => {
            setEditingHabit(null);
            setIsModalOpen(true);
          }}
          className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
        {['Week 04', 'Week 01', 'Week 02', 'Week 03', 'Week 05'].map((week, i) => (
          <button 
            key={week}
            className={cn(
              "flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all",
              i === 0 ? "bg-primary text-on-primary shadow-lg" : "bg-surface-container-low text-on-surface-variant"
            )}
          >
            {week}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-low rounded-[2rem] p-6 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary">{t.weeklyProgress}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-headline font-extrabold">32</span>
            <span className="text-on-surface-variant font-semibold">/ 42</span>
          </div>
        </div>
        <div className="relative h-20 w-20 flex items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            <circle className="text-surface-container-high" cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="8" />
            <circle className="text-secondary" cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="213" strokeDashoffset={213 * (1 - 32/42)} strokeLinecap="round" />
          </svg>
          <Zap className="text-secondary fill-secondary" size={24} />
        </div>
      </div>

      <div className="space-y-6">
        <article className="bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-sm border border-outline/5">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-headline font-bold text-xl">Monday, Oct 23</h3>
              <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                <Calendar size={14} /> {t.week4Day1}
              </p>
            </div>
            <div className="bg-secondary-container px-3 py-1 rounded-full text-on-secondary-container text-sm font-bold">
              {completedCount} / {habits.length}
            </div>
          </div>
          <div className="grid gap-3">
            {habits.map(habit => (
              <div key={habit.id} className="group relative">
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                    habit.completed 
                      ? "bg-secondary-container/30 border-transparent text-secondary" 
                      : "bg-surface-container border-outline/10 text-outline"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                      habit.completed ? "bg-secondary/10" : "bg-surface-container-high"
                    )}>
                      {ICON_MAP[habit.iconName] || <Star size={18} />}
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold block">{habit.name}</span>
                      {habit.type === 'numeric' && (
                        <span className="text-[10px] opacity-70 font-bold uppercase tracking-wider">
                          {habit.current} / {habit.goal}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingHabit(habit);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-lg hover:bg-surface-container-highest text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 size={16} />
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                      habit.completed ? "bg-secondary border-secondary" : "border-outline/30"
                    )}>
                      {habit.completed && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </article>

        <div className="bg-primary rounded-[2rem] p-8 text-on-primary relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-container rounded-full opacity-50 blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <TrendingUp size={32} />
            <h4 className="font-headline font-extrabold text-2xl tracking-tight">{t.streakTitle}</h4>
            <p className="opacity-90 text-sm">{t.streakDesc}</p>
            <button className="bg-white text-primary px-6 py-2 rounded-full font-bold text-sm shadow-lg">{t.viewHistory}</button>
          </div>
        </div>
      </div>

      <HabitModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        habit={editingHabit}
        t={t}
      />
    </motion.div>
  );
};

const GoalsScreen = ({ t }: { t: any; key?: string }) => {
  const [hba1cFrom, setHba1cFrom] = useState('6.4');
  const [hba1cTo, setHba1cTo] = useState('6.0');
  const [medsFrom, setMedsFrom] = useState('2');
  const [medsTo, setMedsTo] = useState('1');
  const [steps, setSteps] = useState('6000');
  const [stretchMins, setStretchMins] = useState('15');
  const [stretchDays, setStretchDays] = useState('3');

  // Health Metrics State
  const [height, setHeight] = useState('175');
  const [initialWeight, setInitialWeight] = useState('94.5');
  const [targetWeight, setTargetWeight] = useState('82.0');
  const [waist, setWaist] = useState('102');

  const [glucose, setGlucose] = useState('112');
  const [hba1cVal, setHba1cVal] = useState('6.4');
  const [bp, setBp] = useState('138/88');
  const [triglyc, setTriglyc] = useState('160');
  const [hdl, setHdl] = useState('42');
  const [ldl, setLdl] = useState('134');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 pb-32 px-6 space-y-10"
    >
      <div className="space-y-2">
        <p className="text-secondary font-bold uppercase tracking-widest text-xs">{t.week4of12}</p>
        <h2 className="font-headline text-3xl font-extrabold tracking-tight">{t.vitalityPath}</h2>
      </div>

      <section className="p-6 rounded-[24px] bg-surface-container-lowest shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-headline text-xl font-bold">{t.primaryGoals}</h3>
            <p className="text-on-surface-variant text-sm">{t.transformationTargets}</p>
          </div>
          <Flag className="text-primary-container" size={20} />
        </div>
        
        <div className="space-y-6">
          {/* HbA1c Goal */}
          <div className="group relative p-4 rounded-xl bg-surface-container-low transition-all hover:bg-surface-container-medium">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span>{t.goalHbA1c}</span>
              <input 
                type="text" 
                value={hba1cFrom} 
                onChange={(e) => setHba1cFrom(e.target.value)}
                className="w-12 bg-surface-container-lowest border-none rounded px-1 py-0.5 text-center font-bold text-primary focus:ring-1 focus:ring-primary"
              />
              <span>{t.goalHbA1cTo}</span>
              <input 
                type="text" 
                value={hba1cTo} 
                onChange={(e) => setHba1cTo(e.target.value)}
                className="w-12 bg-surface-container-lowest border-none rounded px-1 py-0.5 text-center font-bold text-secondary focus:ring-1 focus:ring-secondary"
              />
              <span>%</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 w-64 p-3 bg-black text-white text-[10px] rounded-lg shadow-xl leading-relaxed">
              {t.goalHbA1cTooltip}
              <div className="absolute top-full left-4 border-8 border-transparent border-t-black"></div>
            </div>
          </div>

          {/* Meds Goal */}
          <div className="p-4 rounded-xl bg-surface-container-low">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span>{t.goalMeds}</span>
              <input 
                type="text" 
                value={medsFrom} 
                onChange={(e) => setMedsFrom(e.target.value)}
                className="w-10 bg-surface-container-lowest border-none rounded px-1 py-0.5 text-center font-bold text-primary focus:ring-1 focus:ring-primary"
              />
              <span>{t.goalMedsTo}</span>
              <input 
                type="text" 
                value={medsTo} 
                onChange={(e) => setMedsTo(e.target.value)}
                className="w-10 bg-surface-container-lowest border-none rounded px-1 py-0.5 text-center font-bold text-secondary focus:ring-1 focus:ring-secondary"
              />
              <span>{t.goalMedsUnit}</span>
            </div>
          </div>

          {/* Exercise Goal */}
          <div className="p-4 rounded-xl bg-surface-container-low">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span>{t.goalExerciseWalk}</span>
              <input 
                type="text" 
                value={steps} 
                onChange={(e) => setSteps(e.target.value)}
                className="w-16 bg-surface-container-lowest border-none rounded px-1 py-0.5 text-center font-bold text-primary focus:ring-1 focus:ring-primary"
              />
              <span>{t.goalExerciseSteps}</span>
              <input 
                type="text" 
                value={stretchMins} 
                onChange={(e) => setStretchMins(e.target.value)}
                className="w-10 bg-surface-container-lowest border-none rounded px-1 py-0.5 text-center font-bold text-primary focus:ring-1 focus:ring-primary"
              />
              <span>{t.goalExerciseMins}</span>
              <input 
                type="text" 
                value={stretchDays} 
                onChange={(e) => setStretchDays(e.target.value)}
                className="w-8 bg-surface-container-lowest border-none rounded px-1 py-0.5 text-center font-bold text-primary focus:ring-1 focus:ring-primary"
              />
              <span>{t.goalExerciseDays}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold px-1">{t.healthMetrics}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-[24px] bg-surface-container-lowest border border-outline/5 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <User className="text-secondary" size={18} />
              <h4 className="text-sm font-bold uppercase tracking-wider">{t.bodyComposition}</h4>
            </div>
            <div className="space-y-4">
              {[
                { label: t.height, value: height, setter: setHeight, unit: 'cm' },
                { label: t.initialWeight, value: initialWeight, setter: setInitialWeight, unit: 'kg' },
                { label: t.targetWeight, value: targetWeight, setter: setTargetWeight, unit: 'kg', highlight: true },
                { label: t.waistCirc, value: waist, setter: setWaist, unit: 'cm' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text"
                      value={item.value}
                      onChange={(e) => item.setter(e.target.value)}
                      className={cn(
                        "w-16 bg-surface-container-low border-none rounded px-2 py-1 text-right font-bold focus:ring-1 focus:ring-primary",
                        item.highlight ? "text-secondary" : "text-on-surface"
                      )}
                    />
                    <span className="text-xs text-outline">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-[24px] bg-surface-container-lowest border border-outline/5 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="text-primary" size={18} />
              <h4 className="text-sm font-bold uppercase tracking-wider">{t.latestBloodwork}</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t.glucose, value: glucose, setter: setGlucose },
                { label: t.hba1c, value: hba1cVal, setter: setHba1cVal },
                { label: t.bp, value: bp, setter: setBp },
                { label: t.triglyc, value: triglyc, setter: setTriglyc },
                { label: t.hdl, value: hdl, setter: setHdl },
                { label: t.ldl, value: ldl, setter: setLdl },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <label className="text-[10px] text-on-surface-variant uppercase font-bold">{item.label}</label>
                  <input 
                    type="text"
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg px-2 py-1 text-sm font-bold focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    <section className="p-8 rounded-[32px] bg-primary text-on-primary flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container rounded-full blur-[80px] opacity-40 -translate-y-1/2 translate-x-1/2"></div>
      <div className="relative z-10 w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden bg-surface-variant">
        <img 
          className="w-full h-full object-cover" 
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" 
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="relative z-10 text-center md:text-left space-y-2">
        <h4 className="font-headline text-2xl font-bold">{t.stayCommitted}</h4>
        <p className="opacity-90 text-sm max-w-xs">{t.insulinSensitivity}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wider">
          <Star size={14} fill="currentColor" />
          {t.consistencyMaster}
        </div>
      </div>
    </section>
  </motion.div>
  );
};

const HabitModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  habit,
  t 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (habit: Omit<Habit, 'completed' | 'current'>) => void;
  onDelete?: (id: string) => void;
  habit?: Habit | null;
  t: any;
}) => {
  const [name, setName] = useState(habit?.name || '');
  const [iconName, setIconName] = useState(habit?.iconName || 'star');
  const [type, setType] = useState<'checkbox' | 'numeric'>(habit?.type || 'checkbox');
  const [goal, setGoal] = useState(habit?.goal || 1);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIconName(habit.iconName);
      setType(habit.type);
      setGoal(habit.goal || 1);
    } else {
      setName('');
      setIconName('star');
      setType('checkbox');
      setGoal(1);
    }
  }, [habit, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-md bg-surface-container-low rounded-t-[2rem] sm:rounded-[2rem] p-8 shadow-2xl space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-2xl font-bold">{habit ? t.editHabit : t.addHabit}</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t.habitName}</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Morning Yoga"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t.selectIcon}</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(ICON_MAP).map(key => (
                    <button
                      key={key}
                      onClick={() => setIconName(key)}
                      className={cn(
                        "w-12 h-12 flex items-center justify-center rounded-xl transition-all",
                        iconName === key ? "bg-primary text-white scale-110 shadow-lg" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
                      )}
                    >
                      {ICON_MAP[key]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t.completionCriteria}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setType('checkbox')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                      type === 'checkbox' ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface-variant"
                    )}
                  >
                    {t.checkbox}
                  </button>
                  <button
                    onClick={() => setType('numeric')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                      type === 'numeric' ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface-variant"
                    )}
                  >
                    {t.numericGoal}
                  </button>
                </div>

                {type === 'numeric' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t.goalValue}</label>
                    <input 
                      type="number"
                      value={goal}
                      onChange={(e) => setGoal(Number(e.target.value))}
                      className="w-full bg-surface-container-lowest border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {habit && onDelete && (
                <button 
                  onClick={() => {
                    onDelete(habit.id);
                    onClose();
                  }}
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-error-container text-on-error-container hover:bg-error/10 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button 
                onClick={() => {
                  onSave({ id: habit?.id || '', name, iconName, type, goal });
                  onClose();
                }}
                className="flex-grow py-4 rounded-2xl bg-primary text-on-primary font-bold shadow-lg active:scale-95 transition-all"
              >
                {t.save}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const AssessScreen = ({ t }: { t: any; key?: string }) => {
  const [metrics, setMetrics] = useState({
    energy: 8,
    clarity: 9,
    hunger: 7,
    sleep: 6,
    digestion: 8,
    mood: 9,
    weight: 5,
    cravings: 4,
    performance: 7,
    wellbeing: 8
  });

  const updateMetric = (key: keyof typeof metrics, val: number) => {
    setMetrics(prev => ({ ...prev, [key]: val }));
  };

  const Slider = ({ label, value, onChange, color = "primary" }: { label: string; value: number; onChange: (v: number) => void; color?: string }) => (
    <div className="relative">
      <div className="flex justify-between items-end mb-3">
        <label className="font-body font-bold text-sm">{label}</label>
        <span className={cn("text-2xl font-headline font-extrabold", color === "primary" ? "text-primary" : "text-secondary")}>
          {value}
          <span className="text-xs text-outline font-normal ml-1">/10</span>
        </span>
      </div>
      <input 
        type="range" 
        min="1" 
        max="10" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="assessment-slider"
      />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 pb-32 px-6 space-y-10"
    >
      <div className="space-y-2">
        <p className="text-secondary font-semibold uppercase tracking-widest text-[11px]">{t.progressReview}</p>
        <h2 className="font-headline font-extrabold text-3xl tracking-tight">{t.weeklyAssessment}</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-on-surface-variant">{t.selectedInterval}</span>
          <span className="text-xs text-outline italic">{t.week4of12}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
            <button 
              key={w}
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all",
                w === 4 ? "bg-primary text-on-primary shadow-lg" : "bg-surface-container-low text-on-surface-variant"
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-surface-container-low p-6 rounded-[2rem] space-y-8">
          <div className="flex items-center gap-2">
            <Zap className="text-secondary fill-secondary" size={20} />
            <h3 className="font-headline font-bold text-lg text-primary">{t.vitalityMetrics}</h3>
          </div>
          <Slider label={t.energyLevel} value={metrics.energy} onChange={(v) => updateMetric('energy', v)} />
          <Slider label={t.mentalClarity} value={metrics.clarity} onChange={(v) => updateMetric('clarity', v)} />
          <Slider label={t.hungerControl} value={metrics.hunger} onChange={(v) => updateMetric('hunger', v)} />
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm border border-outline/5 space-y-8">
          <div className="flex items-center gap-2">
            <Moon className="text-primary fill-primary" size={20} />
            <h3 className="font-headline font-bold text-lg text-secondary">{t.recoveryBalance}</h3>
          </div>
          <Slider label={t.sleepQuality} value={metrics.sleep} onChange={(v) => updateMetric('sleep', v)} color="secondary" />
          <Slider label={t.digestion} value={metrics.digestion} onChange={(v) => updateMetric('digestion', v)} color="secondary" />
          <Slider label={t.mood} value={metrics.mood} onChange={(v) => updateMetric('mood', v)} color="secondary" />
        </div>

        <div className="bg-surface-container-low p-6 rounded-[2rem] space-y-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary" size={20} />
            <h3 className="font-headline font-bold text-lg text-primary">{t.physicalEvolution}</h3>
          </div>
          <Slider label={t.weightTrend} value={metrics.weight} onChange={(v) => updateMetric('weight', v)} />
          <Slider label={t.cravings} value={metrics.cravings} onChange={(v) => updateMetric('cravings', v)} />
          <Slider label={t.physicalPerformance} value={metrics.performance} onChange={(v) => updateMetric('performance', v)} />
          <div className="pt-4 border-t border-outline/10">
            <Slider label={t.overallWellbeing} value={metrics.wellbeing} onChange={(v) => updateMetric('wellbeing', v)} />
          </div>
        </div>
      </div>

      <button className="w-full bg-primary text-on-primary font-headline font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
        <ShieldCheck size={20} />
        {t.finalizeData}
      </button>
    </motion.div>
  );
};

const InsightsScreen = ({ t }: { t: any; key?: string }) => {
  const weightData = [
    { name: 'W1', val: 35 },
    { name: 'W2', val: 32 },
    { name: 'W3', val: 28 },
    { name: 'W4', val: 22 },
    { name: 'W5', val: 25 },
    { name: 'W6', val: 15 },
    { name: 'W7', val: 10 },
    { name: 'W8', val: 5 },
  ];

  const hba1cData = [
    { name: '1', val: 90 },
    { name: '2', val: 85 },
    { name: '3', val: 70 },
    { name: '4', val: 75 },
    { name: '5', val: 60 },
    { name: '6', val: 55 },
    { name: '7', val: 50 },
    { name: '8', val: 45 },
    { name: '9', val: 40 },
    { name: '10', val: 35 },
    { name: '11', val: 30 },
    { name: '12', val: 25 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 pb-32 px-6 space-y-10"
    >
      <div className="space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">{t.transformation}</h2>
        <p className="text-on-surface-variant">{t.metricsTrending}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-sm border-l-4 border-secondary space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest block mb-1">{t.bodyWeight}</span>
              <h3 className="font-headline text-2xl font-bold">-4.2kg <span className="text-sm font-normal text-on-surface-variant">{t.total}</span></h3>
            </div>
            <TrendingUp className="text-primary-container" size={20} />
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <Line type="monotone" dataKey="val" stroke="#006565" strokeWidth={3} dot={{ r: 4, fill: "#006565" }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] font-bold text-outline uppercase tracking-tighter">Week 1</span>
              <span className="text-[9px] font-bold text-outline uppercase tracking-tighter">Week 12</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-sm border-l-4 border-primary space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-widest block mb-1">{t.hba1c} Levels</span>
              <h3 className="font-headline text-2xl font-bold">5.4% <span className="text-sm font-normal text-on-surface-variant">{t.current}</span></h3>
            </div>
            <Zap className="text-secondary" size={20} />
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hba1cData}>
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {hba1cData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === hba1cData.length - 1 ? "#006565" : "#76d6d5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className="bg-surface-container-low rounded-[2rem] p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-sm space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1 rounded-full">
            <Sparkles className="text-primary" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t.proTip}</span>
          </div>
          <h4 className="font-headline text-xl font-bold leading-tight">{t.metabolicFlexibility}</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed">{t.metabolicFlexibilityDesc}</p>
          <button className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 active:scale-95 transition-all">
            {t.fullReport}
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-secondary-container/30 rounded-full blur-3xl"></div>
      </section>

      <section className="space-y-6">
        <h3 className="font-headline text-2xl font-bold">{t.shareJourney}</h3>
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/40 shadow-xl space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0 shadow-lg">
              <Share2 className="text-white" size={40} />
            </div>
            <div className="text-center md:text-left space-y-6">
              <p className="text-on-surface-variant leading-relaxed">{t.shareDesc}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button className="bg-gradient-to-br from-primary to-primary-container text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-md active:scale-95">
                  <Share2 size={20} />
                  {t.shareLink}
                </button>
                <div className="flex items-center gap-3">
                  {[MessageSquare, AtSign, LinkIcon].map((Icon, i) => (
                    <button key={i} className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                      <Icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-secondary-container/40 rounded-[2rem] p-6 flex items-center gap-6">
        <div className="flex -space-x-4">
          {[1, 2, 3].map(i => (
            <img 
              key={i}
              className="w-10 h-10 rounded-full border-2 border-white object-cover" 
              src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&q=80&w=100`} 
              referrerPolicy="no-referrer"
            />
          ))}
          <div className="w-10 h-10 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-[10px] font-bold text-white tracking-tighter">+12k</div>
        </div>
        <div>
          <p className="text-sm font-semibold text-on-secondary-container">{t.joinOthers}</p>
          <p className="text-xs text-on-secondary-container/70">{t.communityAverage}</p>
        </div>
      </div>
    </motion.div>
  );
};

const FeedbackScreen = ({ t }: { t: any; key?: string }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="pt-20 pb-32 px-6 space-y-12"
  >
    <div className="space-y-4">
      <h2 className="font-headline font-extrabold text-4xl tracking-tight leading-tight">{t.feedbackMatters}</h2>
      <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
        {t.feedbackDesc}
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-sm relative overflow-hidden group border-l-4 border-secondary">
        <h3 className="font-headline font-bold text-xl mb-6">{t.howAreWeDoing}</h3>
        <div className="flex justify-between items-center gap-2 mb-8">
          {[
            { emoji: '😫', label: t.poor },
            { emoji: '😕', label: t.fair },
            { emoji: '😊', label: t.good, active: true },
            { emoji: '🤩', label: t.great },
          ].map(item => (
            <button 
              key={item.label}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                item.active ? "bg-secondary-container/30" : "hover:bg-surface-container-low"
              )}
            >
              <span className={cn("text-3xl transition-all", !item.active && "grayscale hover:grayscale-0")}>{item.emoji}</span>
              <span className={cn("text-[10px] font-bold uppercase tracking-widest", item.active ? "text-secondary" : "text-outline")}>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          <label className="block font-semibold text-sm text-on-surface-variant">{t.quickRating}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => <Star key={i} size={20} className="text-secondary fill-secondary" />)}
            <Star size={20} className="text-outline-variant" />
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-[1.5rem] p-8 space-y-10">
        <div className="space-y-6">
          <h3 className="font-headline font-bold text-xl">{t.ourMethod}</h3>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
              <ShieldCheck className="text-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm">{t.anonymousDesign}</h4>
              <p className="text-on-surface-variant text-sm leading-snug">{t.anonymousDesc}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
              <BarChart2 className="text-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm">{t.efficientAnalysis}</h4>
              <p className="text-on-surface-variant text-sm leading-snug">{t.efficientDesc}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-5 rounded-2xl font-headline font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
            {t.openFeedback}
            <ExternalLink size={20} />
          </button>
          <p className="text-center text-[11px] text-outline uppercase tracking-tighter">{t.redirectExternal}</p>
        </div>
      </div>
    </div>

    <div className="relative rounded-[2.5rem] h-48 overflow-hidden">
      <img 
        alt="Collaboration" 
        className="w-full h-full object-cover" 
        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-transparent flex items-center p-8">
        <div className="max-w-xs bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
          <p className="text-white text-sm font-medium italic">{t.feedbackQuote}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const ChatScreen = ({ t }: { t: any; key?: string }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: t.helloSerene }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const response = await chatWithGemini(userMsg);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 pb-32 px-6 h-screen flex flex-col"
    >
      <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-surface-container-low text-on-surface rounded-tl-none"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-container-low p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="animate-spin text-primary" size={18} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
      <div className="pt-4 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.askAnything}
          className="flex-grow bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const ImageGenScreen = ({ t }: { t: any; key?: string }) => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<"1K" | "2K" | "4K">("1K");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const img = await generateWellnessImage(prompt, size);
    setResult(img);
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 pb-32 px-6 space-y-8"
    >
      <div className="space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">{t.wellnessVisualizer}</h2>
        <p className="text-on-surface-variant">{t.visualizerDesc}</p>
      </div>

      <div className="space-y-4">
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.visualizerPlaceholder}
          className="w-full bg-surface-container-low border-none rounded-2xl p-4 h-32 focus:ring-2 focus:ring-primary resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-on-surface-variant">{t.imageSize}</span>
          <div className="flex gap-2">
            {(["1K", "2K", "4K"] as const).map(s => (
              <button 
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-xs transition-all",
                  size === s ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-primary text-on-primary py-5 rounded-2xl font-headline font-bold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
          {loading ? t.generating : t.generateImage}
        </button>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl overflow-hidden shadow-2xl border border-outline/10"
        >
          <img src={result} alt="Generated wellness" className="w-full h-auto" />
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const t = translations[language];

  const screenTitles: Record<Screen, string> = {
    home: t.appName,
    tracker: t.tracker,
    goals: t.goals,
    assess: t.assess,
    insights: t.insights,
    feedback: t.feedback,
    chat: t.sereneAI,
    'image-gen': t.visualizer
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-secondary-container">
      <TopBar 
        title={screenTitles[screen]} 
        onSettings={() => setIsSettingsOpen(true)}
      />
      
      <main className="max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {screen === 'home' && <HomeScreen key="home" onBegin={() => setScreen('tracker')} t={t} />}
          {screen === 'tracker' && <TrackerScreen key="tracker" t={t} />}
          {screen === 'goals' && <GoalsScreen key="goals" t={t} />}
          {screen === 'assess' && <AssessScreen key="assess" t={t} />}
          {screen === 'insights' && <InsightsScreen key="insights" t={t} />}
          {screen === 'feedback' && <FeedbackScreen key="feedback" t={t} />}
          {screen === 'chat' && <ChatScreen key="chat" t={t} />}
          {screen === 'image-gen' && <ImageGenScreen key="image-gen" t={t} />}
        </AnimatePresence>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLanguage={language}
        onLanguageChange={setLanguage}
        t={t}
      />

      {/* Floating Action Buttons for AI features */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-40">
        <button 
          onClick={() => setScreen('image-gen')}
          className="h-14 w-14 rounded-2xl bg-secondary text-white shadow-xl flex items-center justify-center active:scale-90 transition-all"
        >
          <ImageIcon size={24} />
        </button>
        <button 
          onClick={() => setScreen('chat')}
          className="h-14 w-14 rounded-2xl bg-primary text-on-primary shadow-xl flex items-center justify-center active:scale-90 transition-all"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      <BottomNav active={screen} onChange={setScreen} t={t} />
    </div>
  );
}
