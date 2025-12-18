import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useStore } from './context/StoreContext';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage';
import TodayPage from './pages/TodayPage';
import UnfinishedPage from './pages/UnfinishedPage';
import ThisWeekPage from './pages/ThisWeekPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import NextActionsPage from './pages/NextActionsPage';
import UpcomingPage from './pages/UpcomingPage';
import InboxPage from './pages/InboxPage';
import { CheckCircle2, Calendar, Target, CalendarRange, Settings, Zap, CalendarClock } from 'lucide-react'; // Using Target icon for Unfinished/Focus
import type { Problem } from './types';
import CreateProblemModal from './components/CreateProblemModal';
import { useState, useEffect } from 'react';

function App() {
  const { state } = useStore();
  const location = useLocation();
  const layout = state.settings?.layout || 'one-column';
  const [isCreatingProblem, setIsCreatingProblem] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'c' || e.key === 'n') {
        e.preventDefault();
        setIsCreatingProblem(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate total recursive problems (only incomplete)
  const countProblems = (problems: Problem[]): number => {
    let count = 0;
    for (const p of problems) {
      if (!p.completed) {
        count += 1;
      }
      count += countProblems(p.subproblems);
    }
    return count;
  };

  // Calculate Today problems (recursive, incomplete, priority='today')
  const countTodayProblems = (problems: Problem[]): number => {
    let count = 0;
    for (const p of problems) {
      if (!p.completed && p.priority === 'today') {
        count += 1;
      }
      count += countTodayProblems(p.subproblems);
    }
    return count;
  };

  // Helper: Is date in current week (Monday to Sunday)?
  // Must match ThisWeekPage logic for consistency
  const isDateInCurrentWeek = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    // const d = new Date(dateStr);
    const now = new Date();

    const currentDay = now.getDay(); // 0 = Sunday
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const [year, month, day] = dateStr.split('-').map(Number);
    const checkDate = new Date(year, month - 1, day);

    return checkDate >= monday && checkDate <= sunday;
  };

  // Calculate This Week problems
  const countWeekProblems = (problems: Problem[]): number => {
    let count = 0;
    for (const p of problems) {
      if (!p.completed) {
        const isPriorityMatch = p.priority === 'today' || p.priority === 'this_week';
        const isDueMatch = isDateInCurrentWeek(p.dueDate);
        if (isPriorityMatch || isDueMatch) {
          count += 1;
        }
      }
      count += countWeekProblems(p.subproblems);
    }
    return count;
  };

  // Calculate Upcoming problems (unsolved && due date > today)
  const countUpcomingProblems = (problems: Problem[]): number => {
    let count = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toLocaleDateString('en-CA');

    for (const p of problems) {
      if (!p.completed && p.dueDate) {
        if (p.dueDate > todayStr) {
          count += 1;
        }
      }
      count += countUpcomingProblems(p.subproblems);
    }
    return count;
  };


  // Calculate Unfinished problems (solving or blocked)
  const countUnfinishedProblems = (problems: Problem[]): number => {
    let count = 0;
    for (const p of problems) {
      if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) {
        count += 1;
      }
      count += countUnfinishedProblems(p.subproblems);
    }
    return count;
  };

  // Calculate Next Actions (recursive, incomplete, no incomplete children)
  const countNextActionsProblems = (problems: Problem[]): number => {
    let count = 0;
    for (const p of problems) {
      if (!p.completed) {
        const incompleteChildren = p.subproblems.filter(sub => !sub.completed);
        if (incompleteChildren.length === 0) {
          count += 1;
        }
      }
      count += countNextActionsProblems(p.subproblems);
    }
    return count;
  };


  const totalProblems = state.lists.reduce((acc, list) => {
    return acc + countProblems(list.problems);
  }, 0);

  const todayProblemsCount = state.lists.reduce((acc, list) => {
    return acc + countTodayProblems(list.problems);
  }, 0);

  const unfinishedProblemsCount = state.lists.reduce((acc, list) => {
    return acc + countUnfinishedProblems(list.problems);
  }, 0);

  const weekProblemsCount = state.lists.reduce((acc, list) => {
    return acc + countWeekProblems(list.problems);
  }, 0);




  const title = totalProblems === 0 ? '0 problems' : `${totalProblems} problems`;

  // Calculate Inbox count
  const inboxList = state.lists.find(l => l.id === 'inbox');
  const inboxCount = inboxList ? countProblems(inboxList.problems) : 0;
  const isInboxActive = location.pathname === '/inbox';
  const isTodayActive = location.pathname === '/today';
  const isWeekActive = location.pathname === '/week';
  const isUpcomingActive = location.pathname === '/upcoming';
  const isUnfinishedActive = location.pathname === '/unfinished';
  const isNextActionsActive = location.pathname === '/next-actions';
  const isSettingsActive = location.pathname === '/settings';

  // --- Two Column Layout ---
  if (layout === 'two-columns') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '1200px' }}>
          <Sidebar onOpenCreateProblem={() => setIsCreatingProblem(true)} />
          <main style={{ flex: 1, padding: '2rem 3rem' }}>
            <Routes>
              {/* Redirect root to /today in 2-column mode to avoid empty/redundant page */}
              <Route path="/" element={<Navigate to="/today" replace />} />
              <Route path="/today" element={<TodayPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/week" element={<ThisWeekPage />} />
              <Route path="/upcoming" element={<UpcomingPage />} />
              <Route path="/unfinished" element={<UnfinishedPage />} />
              <Route path="/next-actions" element={<NextActionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/list/:listId" element={<ProblemPage />} />
              <Route path="/list/:listId/problem/:problemId" element={<ProblemPage />} />
            </Routes>
          </main>
        </div>
        <CreateProblemModal
          isOpen={isCreatingProblem}
          onClose={() => setIsCreatingProblem(false)}
          defaultListId="inbox"
          showListSelector={true}
          parentId={null}
        />
      </div>
    );
  }

  // --- One Column Layout (Original) ---
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111', textDecoration: 'none' }}>
          {totalProblems === 0 && <CheckCircle2 size={24} color="#22c55e" />}
          <span>{title}</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            to="/inbox"
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: isInboxActive ? '#eee' : 'transparent',
              borderRadius: '8px',
              color: isInboxActive ? '#111' : '#666',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            Inbox
            {inboxCount > 0 && (
              <span style={{
                backgroundColor: isInboxActive ? '#333' : '#e5e5e5',
                color: isInboxActive ? '#fff' : '#333',
                fontSize: '0.75rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {inboxCount}
              </span>
            )}
          </Link>

          <Link
            to="/today"
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: isTodayActive ? '#eee' : 'transparent',
              borderRadius: '8px',
              color: isTodayActive ? '#111' : '#666',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            <Calendar size={16} />
            Today
            {todayProblemsCount > 0 && (
              <span style={{
                backgroundColor: isTodayActive ? '#333' : '#e5e5e5',
                color: isTodayActive ? '#fff' : '#333',
                fontSize: '0.75rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {todayProblemsCount}
              </span>
            )}
          </Link>

          <Link
            to="/week"
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: isWeekActive ? '#eee' : 'transparent',
              borderRadius: '8px',
              color: isWeekActive ? '#111' : '#666',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            <CalendarRange size={16} />
            This Week
            {weekProblemsCount > 0 && (
              <span style={{
                backgroundColor: isWeekActive ? '#333' : '#e5e5e5',
                color: isWeekActive ? '#fff' : '#333',
                fontSize: '0.75rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {weekProblemsCount}
              </span>
            )}
          </Link>

          <Link
            to="/unfinished"
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: isUnfinishedActive ? '#eee' : 'transparent',
              borderRadius: '8px',
              color: isUnfinishedActive ? '#111' : '#666',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            <Target size={16} />
            Unfinished
            {unfinishedProblemsCount > 0 && (
              <span style={{
                backgroundColor: isUnfinishedActive ? '#333' : '#e5e5e5',
                color: isUnfinishedActive ? '#fff' : '#333',
                fontSize: '0.75rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {unfinishedProblemsCount}
              </span>
            )}
          </Link>
        </div>

        <Link
          to="/settings"
          style={{
            marginLeft: 'auto', // Push to far right
            padding: '0.5rem',
            backgroundColor: isSettingsActive ? '#eee' : 'transparent',
            borderRadius: '8px',
            color: isSettingsActive ? '#111' : '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s, background-color 0.2s'
          }}
          onMouseEnter={e => !isSettingsActive && (e.currentTarget.style.color = '#333')}
          onMouseLeave={e => !isSettingsActive && (e.currentTarget.style.color = '#888')}
        >
          <Settings size={20} />
        </Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/week" element={<ThisWeekPage />} />
          <Route path="/unfinished" element={<UnfinishedPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/list/:listId" element={<ProblemPage />} />
          <Route path="/list/:listId/problem/:problemId" element={<ProblemPage />} />
        </Routes>
      </main>
      <CreateProblemModal
        isOpen={isCreatingProblem}
        onClose={() => setIsCreatingProblem(false)}
        defaultListId="inbox"
        showListSelector={true}
        parentId={null}
      />
    </div>
  );
}

export default App;
