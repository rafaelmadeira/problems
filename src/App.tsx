import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useStore } from './context/StoreContext';

import ProblemPage from './pages/ProblemPage';
import TodayPage from './pages/TodayPage';
import UnfinishedPage from './pages/UnfinishedPage';
import ThisWeekPage from './pages/ThisWeekPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import NextActionsPage from './pages/NextActionsPage';
import UpcomingPage from './pages/UpcomingPage';
import InboxPage from './pages/InboxPage';
import ListsPage from './pages/ListsPage';
import { Calendar, CalendarRange, Settings, Inbox, CalendarClock, List as ListIcon, Plus } from 'lucide-react'; // Using Target icon for Unfinished/Focus
import type { Problem } from './types';
import CreateProblemModal from './components/CreateProblemModal';
import { useState, useEffect } from 'react';

function App() {
  const { state } = useStore();
  const location = useLocation();
  const layout = state.settings?.layout || 'two-columns';
  const [isCreatingProblem, setIsCreatingProblem] = useState(false);

  // Auto-detect mobile and switch to single-column logic (but we respect user setting if explicitly set... 
  // actually, since we persist it, if user is on mobile we probably want to FORCE single column or just default it?
  // The user said "one column version to be the default version for mobile".
  // This implies if I'm on mobile, it should behave as single column.
  // Track window resize to reactively switch layouts
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Force single-column on mobile, otherwise respect user setting
  const effectiveLayout = isMobile ? 'single-column' : layout;

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



  const weekProblemsCount = state.lists.reduce((acc, list) => {
    return acc + countWeekProblems(list.problems);
  }, 0);






  // Calculate Inbox count
  const inboxList = state.lists.find(l => l.id === 'inbox');
  const inboxCount = inboxList ? countProblems(inboxList.problems) : 0;
  const isInboxActive = location.pathname === '/inbox';
  const isTodayActive = location.pathname === '/today';
  const isWeekActive = location.pathname === '/week';


  const isSettingsActive = location.pathname === '/settings';

  // --- Two Column Layout ---
  if (effectiveLayout === 'two-columns') {
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

  // --- One Column Layout (Mobile App Style) ---
  const MobileNavItem = ({ to, icon: Icon, label, isActive, count }: any) => (
    <Link
      to={to}
      style={{
        display: 'flex',
        flexDirection: 'column', // Stack icon and label
        alignItems: 'center',
        justifyContent: 'center', // Center vertically
        gap: '2px', // Reduce gap
        textDecoration: 'none',
        flex: 1, // Distribute space evenly
        color: isActive ? '#111' : '#999',
        height: '100%', // Full height of bar
        position: 'relative',
        padding: '4px 0',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -8,
            backgroundColor: '#333',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            minWidth: '16px',
            height: '16px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2px',
            border: '2px solid #fff'
          }}>
            {count}
          </span>
        )}
      </div>
      <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 600 : 400 }}>{label}</span>
      {/* Active Indicator Dot (Optional, maybe specific to design? User didn't ask, but standard) */}
      {/* {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#111', marginTop: 2 }} />} */}
    </Link>
  );

  return (
    <div style={{
      backgroundColor: '#fff',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px', // Mobile max width on desktop
        position: 'relative',
        backgroundColor: '#fff',
        boxShadow: '0 0 20px rgba(0,0,0,0.05)', // Subtle shadow on desktop
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Fixed Top Bar */}
        <header style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          zIndex: 100,
          // borderBottom: '1px solid #f0f0f0' // Cleaner without? User didn't specify.
        }}>
          <Link to="/" style={{
            fontSize: '1.25rem',
            fontWeight: '800',
            color: '#111',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {/* Show count or just 'Antigravity'? User screenshot showed '0 problems' -> 'Problems' */}
            {totalProblems === 0 ? 'Problems' : `${totalProblems} problems`}
          </Link>

          <Link
            to="/settings"
            style={{
              color: isSettingsActive ? '#111' : '#888',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: isSettingsActive ? '#f0f0f0' : 'transparent'
            }}
          >
            <Settings size={22} />
          </Link>
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, paddingBottom: '90px', paddingLeft: '1rem', paddingRight: '1rem' }}> {/* Padding for bottom bar */}
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/week" element={<ThisWeekPage />} />
            <Route path="/upcoming" element={<UpcomingPage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/list/:listId" element={<ProblemPage />} />
            <Route path="/list/:listId/problem/:problemId" element={<ProblemPage />} />
          </Routes>
        </main>

        {/* Fixed Bottom Bar */}
        <nav style={{
          position: 'fixed', // Fixed to viewport bottom, but we want it constrained to container? 
          // If container is centered, 'fixed' bottom 0 spans full width if width 100%. 
          // To constrain to the 640px container, we can use sticky? 
          // No, bottom bars are usually viewport fixed.
          // IF we want it to look like a mobile app ON DESKTOP, it should be within the 640px container.
          // sticky bottom: 0 works if container is full height.
          // BUT sticky relies on scroll container.
          // Let's use fixed but with logic to match width.
          // EASIER: Put it sticky at bottom of flex container.
          // If content is short, it floats up? No, we want it at bottom.
          // 'sticky' works if we have 'min-height: 100vh' on container (we do).
          // Actually, 'position: sticky; bottom: 0;' works well.
          bottom: 0,
          left: '50%', // Center hack if fixed
          transform: 'translateX(-50%)', // Center hack
          width: '100%',
          maxWidth: '640px',
          height: '80px', // Taller for better touch
          backgroundColor: '#fff',
          borderTop: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem', // Side padding
          zIndex: 1000,
          // If on mobile (screen < 640), left/transform/maxWidth handle it.
        }}>
          {/* Inbox */}
          <MobileNavItem
            to="/inbox"
            icon={Inbox}
            label="Inbox"
            count={inboxCount}
            isActive={isInboxActive}
          />
          {/* Today */}
          <MobileNavItem
            to="/today"
            icon={Calendar}
            label="Today"
            count={todayProblemsCount}
            isActive={isTodayActive}
          />
          {/* Week */}
          <MobileNavItem
            to="/week"
            icon={CalendarRange}
            label="Week"
            count={weekProblemsCount}
            isActive={isWeekActive}
          />
          {/* Upcoming */}
          <MobileNavItem
            to="/upcoming"
            icon={CalendarClock}
            label="Upcoming"
            count={0} // Upcoming count not usually badged but we can 
            isActive={location.pathname === '/upcoming'}
          />
          {/* Lists */}
          <MobileNavItem
            to="/lists"
            icon={ListIcon}
            label="Lists"
            count={0}
            isActive={location.pathname === '/lists' || (location.pathname.includes('/list/') && !location.pathname.includes('inbox'))}
          />

          {/* New Problem Button (Inline) based on image 2 assumption (rightmost) */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button
              onClick={() => setIsCreatingProblem(true)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>
        </nav>

        <CreateProblemModal
          isOpen={isCreatingProblem}
          onClose={() => setIsCreatingProblem(false)}
          defaultListId="inbox"
          showListSelector={true}
          parentId={null}
        />
      </div>
    </div>
  );
}

export default App;
