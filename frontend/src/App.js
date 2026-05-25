import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Fees from './pages/Fees';
import FeeParticulars from './pages/FeeParticulars';
import Attendance from './pages/Attendance';
import Exams from './pages/Exams';
import Marks from './pages/Marks';
import TeacherSubjects from './pages/TeacherSubjects';
import DynamicForm from './components/DynamicForm';
import SchoolInfo from './pages/SchoolInfo';
import Subjects from './pages/Subjects';
import AcademicYears from './pages/AcademicYears';
import Divisions from './pages/Divisions';
import Streams from './pages/Streams';

const pages = {
  dashboard: Dashboard, students: Students, teachers: Teachers,
  fees: Fees, 'fee-particulars': FeeParticulars, attendance: Attendance,
  exams: Exams, marks: Marks, 'dynamic-form': DynamicForm,
  'academic-years': AcademicYears, divisions: Divisions,
  subjects: Subjects, streams: Streams,
  'teacher-subjects': TeacherSubjects, 'school-info': SchoolInfo,
};

const adminTabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'students', label: 'Students' },
  { key: 'teachers', label: 'Teachers' },
  { key: 'fees', label: 'Fees' },
  { key: 'fee-particulars', label: 'Fee Particulars' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'exams', label: 'Exams' },
  { key: 'marks', label: 'Marks' },
  { key: 'dynamic-form', label: 'Dynamic Form' },
  { key: 'academic-years', label: 'Academic Years' },
  { key: 'divisions', label: 'Divisions' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'streams', label: 'Streams' },
  { key: 'teacher-subjects', label: 'Teacher Subjects' },
  { key: 'school-info', label: 'School Info' },
];

const teacherTabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'students', label: 'Students' },
  { key: 'fees', label: 'Fees' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'exams', label: 'Exams' },
  { key: 'marks', label: 'Marks' },
];

function getPage() {
  const path = window.location.pathname;
  if (path === '/signup') return 'signup';
  if (path === '/forgot-password') return 'forgot-password';
  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [teacherClass, setTeacherClass] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [page, setPage] = useState(getPage());
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'teacher' && user?.teacher_id) {
      axios.get('/api/divisions').then(r => {
        const divs = r.data || [];
        const match = divs.find(d => Number(d.class_teacher_id) === Number(user.teacher_id));
        if (match) setTeacherClass(match.class_name);
      }).catch(() => {});
    } else if (user?.role === 'admin' && user?.class_name) {
      setTeacherClass(user.class_name);
    }
    if (user?.school_id) {
      axios.get(`/api/school-info/${user.school_id}`).then(r => {
        if (r.data?.school_name) setSchoolName(r.data.school_name);
      }).catch(() => {});
    }
  }, [user]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    setPage(null);
    window.history.pushState(null, '', '/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setTeacherClass('');
    setPage(null);
  };

  const navigate = (p) => {
    setPage(p);
    window.history.pushState(null, '', p === 'signup' ? '/signup' : p === 'forgot-password' ? '/forgot-password' : '/');
  };

  if (!token) {
    if (page === 'signup') return <Signup onLogin={handleLogin} />;
    if (page === 'forgot-password') return <ForgotPassword />;
    return <Login onLogin={handleLogin} />;
  }

  const tabs = user?.role === 'admin' ? adminTabs : teacherTabs;
  const PageComponent = pages[activeTab];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-slate-800 text-slate-100">
        <div className="shrink-0 border-b border-slate-700 px-5 py-5">
          <h1 className="text-base font-bold tracking-wide">SCHOOL ERP</h1>
          <p className="mt-1 text-xs text-slate-400">
            {schoolName && <span className="block">{schoolName}</span>}
            {user?.full_name} ({user?.role === 'admin' && user?.class_name ? `Class ${user.class_name} Admin` : user?.role})
            {user?.role === 'teacher' && teacherClass && ` - Class ${teacherClass}`}
          </p>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full rounded px-4 py-2.5 text-left text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-700 px-3 py-3">
          <button onClick={handleLogout} className="w-full rounded px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col p-6">
        <div className="mx-auto w-full max-w-6xl rounded-xl bg-white p-6 shadow-sm">
          <PageComponent user={user} teacherClass={teacherClass} />
        </div>
      </main>
    </div>
  );
}

export default App;
