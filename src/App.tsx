import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  BarChart3, 
  LogOut, 
  Plus, 
  Trash2, 
  ChevronRight,
  AlertCircle,
  Bell,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserCog,
  History,
  Shield,
  ShieldCheck,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Program, Topic, Trainee, Grade, TraineeReport } from './types';

// Components
const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) onLogin(data.user);
    else setError(data.message || 'خطأ في اسم المستخدم أو كلمة المرور');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-blue-900/5"
      >
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900">نظام إنجاح لإدارة التدريب</h1>
          <p className="text-gray-500 text-sm">تسجيل دخول المسؤول</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">اسم المستخدم</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-200 focus:ring-0 transition-colors outline-none"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-200 focus:ring-0 transition-colors outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <button 
            type="submit"
            className="w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-900/90 transition-colors mt-4"
          >
            دخول
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('programs');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Fetch programs
  const fetchPrograms = async () => {
    const res = await fetch('/api/programs');
    const data = await res.json();
    setPrograms(data);
    checkExpirations(data);
  };

  const checkExpirations = (progList: Program[]) => {
    const now = new Date();
    const alerts: string[] = [];
    progList.forEach(p => {
      const endDate = new Date(p.end_date);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 5 && diffDays > 0) {
        alerts.push(`البرنامج "${p.name}" سينتهي خلال ${diffDays} أيام`);
      } else if (diffDays === 0) {
        alerts.push(`البرنامج "${p.name}" ينتهي اليوم!`);
      } else if (diffDays < 0) {
        // Already expired
      }
    });
    setNotifications(alerts);
  };

  useEffect(() => {
    if (user) fetchPrograms();
  }, [user]);

  useEffect(() => {
    if (selectedProgram) {
      fetchTopics(selectedProgram.id);
      fetchTrainees(selectedProgram.id);
    }
  }, [selectedProgram]);

  const fetchTopics = async (id: number) => {
    const res = await fetch(`/api/programs/${id}/topics`);
    setTopics(await res.json());
  };

  const fetchTrainees = async (id: number) => {
    const res = await fetch(`/api/programs/${id}/trainees`);
    setTrainees(await res.json());
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-white flex font-sans text-right" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-bottom border-gray-100">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl text-blue-900">نظام إنجاح</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="البرامج التدريبية" 
            active={activeTab === 'programs'} 
            onClick={() => { setActiveTab('programs'); setSelectedProgram(null); }}
          />
          <SidebarItem 
            icon={<BarChart3 size={20} />} 
            label="التقارير" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')}
          />
          {user.role === 'admin' && (
            <>
              <SidebarItem 
                icon={<UserCog size={20} />} 
                label="إدارة الموظفين" 
                active={activeTab === 'staff'} 
                onClick={() => setActiveTab('staff')}
              />
              <SidebarItem 
                icon={<History size={20} />} 
                label="سجل الحركات" 
                active={activeTab === 'logs'} 
                onClick={() => setActiveTab('logs')}
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => setUser(null)}
            className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-blue-900">
            {activeTab === 'programs' ? (selectedProgram ? selectedProgram.name : 'البرامج التدريبية') : 
             activeTab === 'reports' ? 'التقارير' : 
             activeTab === 'staff' ? 'إدارة الموظفين' : 'سجل الحركات'}
          </h2>
          
          <div className="flex items-center gap-4">
            <NotificationsModal notifications={notifications} />
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
              <span className="text-xs font-bold">{user.username[0].toUpperCase()}</span>
            </div>
          </div>
        </header>

        <div className="p-8">
          {notifications.length > 0 && (
            <div className="mb-8 space-y-2">
              {notifications.map((n, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800"
                >
                  <AlertCircle size={20} />
                  <span className="font-medium">{n}</span>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'programs' && !selectedProgram && (
            <ProgramsList 
              programs={programs} 
              onSelect={setSelectedProgram} 
              onRefresh={fetchPrograms} 
              user={user}
            />
          )}

          {activeTab === 'programs' && selectedProgram && (
            <ProgramManager 
              program={selectedProgram} 
              topics={topics} 
              trainees={trainees}
              onRefreshTopics={() => fetchTopics(selectedProgram.id)}
              onRefreshTrainees={() => fetchTrainees(selectedProgram.id)}
              user={user}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView programs={programs} />
          )}

          {activeTab === 'staff' && (
            <StaffManager currentUser={user} />
          )}

          {activeTab === 'logs' && (
            <ActivityLogs />
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-components
const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${
      active ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const ProgramsList = ({ programs, onSelect, onRefresh, user }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, end_date: newDate, userId: user.id, username: user.username })
    });
    setNewName('');
    setNewDate('');
    setShowAdd(false);
    onRefresh();
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDeleteAction = async () => {
    if (confirmDeleteId !== null) {
      await fetch(`/api/programs/${confirmDeleteId}?userId=${user.id}&username=${user.username}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={confirmDeleteId !== null}
        message="⚠️ تحذير: سيتم حذف البرنامج وكافة الموضوعات والمتدربين والدرجات المرتبطة به. هل أنت متأكد؟"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">قائمة البرامج</h3>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-900/90 transition-colors"
        >
          <Plus size={18} />
          <span>برنامج جديد</span>
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex gap-4 items-end"
          >
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-2">اسم البرنامج</label>
              <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-200"
                required
              />
            </div>
            <div className="w-48">
              <label className="block text-xs font-bold text-gray-500 mb-2">تاريخ الانتهاء</label>
              <input 
                type="date" 
                value={newDate} 
                onChange={e => setNewDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-200"
                required
              />
            </div>
            <button type="submit" className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900/90 transition-colors">إضافة</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((p: Program) => (
          <motion.div 
            whileHover={{ y: -4 }}
            key={p.id} 
            onClick={() => onSelect(p)}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <button 
                onClick={(e) => handleDelete(p.id, e)}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <h4 className="text-lg font-bold mb-2">{p.name}</h4>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock size={14} />
              <span>ينتهي في: {p.end_date}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ProgramManager = ({ program, topics, trainees, onRefreshTopics, onRefreshTrainees, user }: any) => {
  const [activeSubTab, setActiveSubTab] = useState('topics');
  const [bulkInput, setBulkInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [confirmDeleteTopicId, setConfirmDeleteTopicId] = useState<number | null>(null);
  const [confirmDeleteTraineeId, setConfirmDeleteTraineeId] = useState<number | null>(null);

  const handleAddTopics = async () => {
    const names = bulkInput.split('\n').filter(n => n.trim());
    if (names.length === 0) return;
    await fetch(`/api/programs/${program.id}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names, userId: user.id, username: user.username })
    });
    setBulkInput('');
    onRefreshTopics();
  };

  const handleDeleteTopic = (id: number) => {
    setConfirmDeleteTopicId(id);
  };

  const confirmDeleteTopicAction = async () => {
    if (confirmDeleteTopicId !== null) {
      await fetch(`/api/topics/${confirmDeleteTopicId}?userId=${user.id}&username=${user.username}`, { method: 'DELETE' });
      setConfirmDeleteTopicId(null);
      onRefreshTopics();
    }
  };

  const handleAddTrainees = async () => {
    const lines = bulkInput.split('\n').filter(l => l.trim());
    const traineeList = lines.map(l => {
      const [name, email] = l.split(',').map(s => s.trim());
      return { name, email: email || '' };
    });
    if (traineeList.length === 0) return;
    await fetch(`/api/programs/${program.id}/trainees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainees: traineeList, userId: user.id, username: user.username })
    });
    setBulkInput('');
    onRefreshTrainees();
  };

  const handleDeleteTrainee = (id: number) => {
    setConfirmDeleteTraineeId(id);
  };

  const confirmDeleteTraineeAction = async () => {
    if (confirmDeleteTraineeId !== null) {
      await fetch(`/api/trainees/${confirmDeleteTraineeId}?userId=${user.id}&username=${user.username}`, { method: 'DELETE' });
      setConfirmDeleteTraineeId(null);
      onRefreshTrainees();
    }
  };

  return (
    <div className="space-y-8">
      <ConfirmModal 
        isOpen={confirmDeleteTopicId !== null}
        message="هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف كافة الدرجات المرتبطة به."
        onConfirm={confirmDeleteTopicAction}
        onCancel={() => setConfirmDeleteTopicId(null)}
      />
      <ConfirmModal 
        isOpen={confirmDeleteTraineeId !== null}
        message="هل أنت متأكد من حذف هذا المتدرب؟ سيتم حذف كافة درجاته."
        onConfirm={confirmDeleteTraineeAction}
        onCancel={() => setConfirmDeleteTraineeId(null)}
      />
      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveSubTab('topics')}
          className={`pb-4 px-4 font-bold transition-colors relative ${activeSubTab === 'topics' ? 'text-blue-900' : 'text-gray-400'}`}
        >
          الموضوعات
          {activeSubTab === 'topics' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-900 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('trainees')}
          className={`pb-4 px-4 font-bold transition-colors relative ${activeSubTab === 'trainees' ? 'text-blue-900' : 'text-gray-400'}`}
        >
          المتدربين
          {activeSubTab === 'trainees' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-900 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('grades')}
          className={`pb-4 px-4 font-bold transition-colors relative ${activeSubTab === 'grades' ? 'text-blue-900' : 'text-gray-400'}`}
        >
          رصد الدرجات
          {activeSubTab === 'grades' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-900 rounded-t-full" />}
        </button>
      </div>

      {activeSubTab === 'topics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold mb-4">إضافة موضوعات (لصق قائمة)</h4>
            <textarea 
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              className="w-full h-48 p-4 rounded-xl border border-gray-200 outline-none focus:border-blue-200 mb-4 font-mono text-sm"
              placeholder="أدخل كل موضوع في سطر جديد..."
            />
            <button 
              onClick={handleAddTopics}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-900/90 transition-colors"
            >
              إضافة الموضوعات
            </button>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold mb-4">الموضوعات الحالية ({topics.length})</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {topics.map((t: Topic, i: number) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between group/item">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono text-xs">{i + 1}</span>
                    <span className="font-medium">{t.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteTopic(t.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'trainees' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold mb-4">إضافة متدربين (لصق قائمة)</h4>
            <textarea 
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              className="w-full h-48 p-4 rounded-xl border border-gray-200 outline-none focus:border-blue-200 mb-4 font-mono text-sm"
              placeholder="الاسم, الايميل (اختياري)&#10;أحمد علي, ahmed@example.com&#10;سارة محمد"
            />
            <button 
              onClick={handleAddTrainees}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-900/90 transition-colors"
            >
              إضافة المتدربين
            </button>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold mb-4">المتدربين المسجلين ({trainees.length})</h4>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="بحث بالاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 focus:border-blue-200 outline-none text-sm"
              />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {trainees.filter((t: Trainee) => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((t: Trainee) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center group/item">
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteTrainee(t.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                    >
                      <Trash size={14} />
                    </button>
                    <Users size={16} className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold mb-4">اختر المتدرب</h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {trainees.map((t: Trainee) => (
                <button 
                  key={t.id}
                  onClick={() => setSelectedTrainee(t)}
                  className={`w-full p-4 rounded-xl text-right transition-all flex items-center justify-between ${
                    selectedTrainee?.id === t.id ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-bold">{t.name}</span>
                  <ChevronRight size={16} className={selectedTrainee?.id === t.id ? 'text-white' : 'text-gray-300'} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {selectedTrainee ? (
              <GradeForm trainee={selectedTrainee} topics={topics} user={user} />
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <Users size={48} className="mb-4 opacity-20" />
                <p>يرجى اختيار متدرب من القائمة للبدء في رصد الدرجات</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GradeForm = ({ trainee, topics, user }: { trainee: Trainee, topics: Topic[], user: any }) => {
  const [grades, setGrades] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchGrades = async () => {
      const res = await fetch(`/api/trainees/${trainee.id}/report`);
      const data = await res.json();
      const existingGrades: Record<number, number> = {};
      data.details.forEach((g: any) => {
        if (g.score !== null) existingGrades[g.topic_id] = g.score;
      });
      setGrades(existingGrades);
    };
    fetchGrades();
    setSaved(false);
  }, [trainee]);

  const handleSave = async (topicId: number, score: number) => {
    setLoading(true);
    await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainee_id: trainee.id, topic_id: topicId, score, userId: user.id, username: user.username })
    });
    setGrades(prev => ({ ...prev, [topicId]: score }));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-bold text-xl">رصد درجات: {trainee.name}</h4>
          <p className="text-sm text-gray-500">أدخل الدرجة من 0 إلى 100 لكل موضوع</p>
        </div>
        {saved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 size={16} />
            <span>تم الحفظ</span>
          </motion.div>
        )}
      </div>

      <div className="space-y-4">
        {topics.map((t: Topic) => (
          <div key={t.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex-1 font-bold">{t.name}</div>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                min="0" 
                max="100"
                value={grades[t.id] ?? ''}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100) {
                    handleSave(t.id, val);
                  } else if (e.target.value === '') {
                    setGrades(prev => {
                      const next = { ...prev };
                      delete next[t.id];
                      return next;
                    });
                  }
                }}
                className="w-20 p-2 rounded-lg border border-gray-200 text-center font-bold focus:border-blue-200 outline-none"
              />
              <div className="w-24 text-center">
                {grades[t.id] !== undefined ? (
                  grades[t.id] >= 50 ? (
                    <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">ناجح</span>
                  ) : (
                    <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold">راسب</span>
                  )
                ) : (
                  <span className="text-gray-400 text-xs italic">بانتظار التقييم</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsView = ({ programs }: { programs: Program[] }) => {
  const [selectedProg, setSelectedProg] = useState<number | ''>('');
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<number | ''>('');
  const [report, setReport] = useState<TraineeReport | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProg) {
      fetch(`/api/programs/${selectedProg}/trainees`).then(res => res.json()).then(setTrainees);
      setSelectedTrainee('');
      setReport(null);
      setFilter(null);
    }
  }, [selectedProg]);

  useEffect(() => {
    if (selectedTrainee) {
      fetch(`/api/trainees/${selectedTrainee}/report`).then(res => res.json()).then(setReport);
      setFilter(null);
    }
  }, [selectedTrainee]);

  const filteredDetails = report?.details.filter(d => {
    if (!filter) return false;
    if (filter === 'passed') return d.status === 'pass';
    if (filter === 'failed') return d.status === 'fail';
    if (filter === 'incomplete') return d.score === null;
    if (filter === 'evaluated') return d.score !== null;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-xs font-bold text-gray-500 mb-2">اختر البرنامج</label>
          <select 
            value={selectedProg}
            onChange={e => setSelectedProg(parseInt(e.target.value))}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-200"
          >
            <option value="">-- اختر --</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-xs font-bold text-gray-500 mb-2">اختر المتدرب</label>
          <select 
            value={selectedTrainee}
            onChange={e => setSelectedTrainee(parseInt(e.target.value))}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-200"
            disabled={!selectedProg}
          >
            <option value="">-- اختر --</option>
            {trainees.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {report && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard 
              label="إجمالي الموضوعات" 
              value={report.stats.totalTopics} 
              icon={<BookOpen size={20} />} 
              color="blue" 
              onClick={() => setFilter(null)}
              active={filter === null}
            />
            <StatCard 
              label="المقيم منها" 
              value={report.stats.evaluated} 
              icon={<CheckCircle2 size={20} />} 
              color="indigo" 
              onClick={() => setFilter('evaluated')}
              active={filter === 'evaluated'}
            />
            <StatCard 
              label="الناجح" 
              value={report.stats.passed} 
              icon={<CheckCircle2 size={20} />} 
              color="green" 
              onClick={() => setFilter('passed')}
              active={filter === 'passed'}
            />
            <StatCard 
              label="الراسب" 
              value={report.stats.failed} 
              icon={<XCircle size={20} />} 
              color="red" 
              onClick={() => setFilter('failed')}
              active={filter === 'failed'}
            />
            <StatCard 
              label="غير مكتمل" 
              value={report.stats.incomplete} 
              icon={<Clock size={20} />} 
              color="amber" 
              onClick={() => setFilter('incomplete')}
              active={filter === 'incomplete'}
            />
          </div>

          {/* Filtered List */}
          <AnimatePresence mode="wait">
            {filter && (
              <motion.div 
                key={filter}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
              >
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <span>قائمة الموضوعات:</span>
                  <span className="text-gray-500">
                    {filter === 'passed' ? 'الناجح فيها' : filter === 'failed' ? 'الراسب فيها' : filter === 'incomplete' ? 'غير المكتملة' : 'المقيمة'}
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredDetails?.map((d, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <span className="font-medium">{d.topic_name}</span>
                      <span className="text-xs font-bold font-mono bg-white px-2 py-1 rounded-lg border border-gray-100">
                        {d.score ?? '-'}
                      </span>
                    </div>
                  ))}
                  {filteredDetails?.length === 0 && (
                    <div className="col-span-full text-center py-4 text-gray-400 italic">لا توجد موضوعات في هذا التصنيف</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detailed Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold text-gray-600">الموضوع</th>
                  <th className="p-4 font-bold text-gray-600">الدرجة</th>
                  <th className="p-4 font-bold text-gray-600">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {report.details.map((d, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium">{d.topic_name}</td>
                    <td className="p-4 font-mono font-bold">{d.score ?? '-'}</td>
                    <td className="p-4">
                      {d.score === null ? (
                        <span className="text-gray-400 text-xs">غير مكتمل</span>
                      ) : d.status === 'pass' ? (
                        <span className="text-green-600 font-bold">ناجح</span>
                      ) : (
                        <span className="text-red-600 font-bold">راسب</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const StaffManager = ({ currentUser }: { currentUser: any }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchStaff = async () => {
    const res = await fetch('/api/staff');
    setStaff(await res.json());
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role, userId: currentUser.id, adminUsername: currentUser.username })
    });
    if (res.ok) {
      setUsername('');
      setPassword('');
      setShowAdd(false);
      fetchStaff();
    } else {
      setError('اسم المستخدم موجود مسبقاً');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDeleteAction = async () => {
    if (confirmDeleteId !== null) {
      await fetch(`/api/staff/${confirmDeleteId}?userId=${currentUser.id}&username=${currentUser.username}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      fetchStaff();
    }
  };

  const generateCredentials = () => {
    const random = Math.random().toString(36).substring(7);
    setUsername(`staff_${random}@training.com`);
    setPassword(Math.random().toString(36).substring(2, 10).toUpperCase());
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={confirmDeleteId !== null}
        message="هل أنت متأكد من حذف هذا الموظف؟"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">إدارة الموظفين</h3>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-900/90 transition-colors"
        >
          <Plus size={18} />
          <span>موظف جديد</span>
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4"
          >
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">اسم المستخدم (الايميل)</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">كلمة المرور (الرمز الرئيسي)</label>
                <input 
                  type="text" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">الصلاحية</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-200"
                >
                  <option value="staff">موظف</option>
                  <option value="admin">مدير</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={generateCredentials}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                توليد ايميل ورمز تلقائي
              </button>
              <button type="submit" className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900/90 transition-colors">إضافة الموظف</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((s: any) => (
          <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-xl">
                <UserCog size={24} className="text-gray-600" />
              </div>
              <div>
                <h4 className="font-bold">{s.username}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {s.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                      <ShieldCheck size={10} />
                      مدير
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full uppercase">
                      <Shield size={10} />
                      موظف
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(s.id)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/logs').then(res => res.json()).then(setLogs);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold">سجل الحركات</h3>
        <p className="text-sm text-gray-500">تتبع كافة الإجراءات المتخذة في النظام</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">المستخدم</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">الإجراء</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">التفاصيل</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-sm">{log.username}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold">{log.action}</span>
                </td>
                <td className="p-4 text-sm text-gray-600">{log.details}</td>
                <td className="p-4 text-xs text-gray-400 font-mono">
                  {new Date(log.created_at).toLocaleString('ar-EG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const NotificationsModal = ({ notifications }: { notifications: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="text-gray-400 hover:text-blue-900 transition-colors" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-30 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h4 className="font-bold text-sm">الإشعارات</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div key={i} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex gap-3">
                      <AlertCircle className="text-amber-500 shrink-0" size={18} />
                      <p className="text-sm text-gray-700 leading-relaxed">{n}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 italic text-sm">لا توجد إشعارات جديدة</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, onClick, active }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-2xl border ${colors[color]} flex flex-col items-center text-center shadow-sm transition-all ${
        active ? 'ring-2 ring-blue-900 ring-offset-2 scale-105 z-10' : 'hover:scale-102'
      }`}
    >
      <div className="mb-3 opacity-80">{icon}</div>
      <div className="text-2xl font-black mb-1">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">{label}</div>
    </button>
  );
};

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }: { isOpen: boolean, message: string, onConfirm: () => void, onCancel: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/50 p-4" onClick={onCancel}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <AlertCircle size={24} />
          <h3 className="text-lg font-bold text-gray-900">تأكيد الحذف</h3>
        </div>
        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold hover:bg-red-600 transition-colors"
          >
            تأكيد
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
};
