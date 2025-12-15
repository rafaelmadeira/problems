import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useStore } from './context/StoreContext';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage';
import TodayPage from './pages/TodayPage';
import UnfinishedPage from './pages/UnfinishedPage';
import { CheckCircle2, Calendar, Target } from 'lucide-react'; // Using Target icon for Unfinished/Focus
import type { Problem } from './types';

function App() {
  const { state } = useStore();
  const location = useLocation();

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


  const totalProblems = state.lists.reduce((acc, list) => {
    return acc + countProblems(list.problems);
  }, 0);

  const todayProblemsCount = state.lists.reduce((acc, list) => {
    return acc + countTodayProblems(list.problems);
  }, 0);

  const unfinishedProblemsCount = state.lists.reduce((acc, list) => {
    return acc + countUnfinishedProblems(list.problems);
  }, 0);


  const title = totalProblems === 0 ? '0 problems' : `${totalProblems} problems`;

  // Calculate Inbox count
  const inboxList = state.lists.find(l => l.id === 'inbox');
  const inboxCount = inboxList ? countProblems(inboxList.problems) : 0;
  const isInboxActive = location.pathname.includes('/list/inbox');
  const isTodayActive = location.pathname === '/today';
  const isUnfinishedActive = location.pathname === '/unfinished';


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111', textDecoration: 'none' }}>
          {totalProblems === 0 && <CheckCircle2 size={24} color="#22c55e" />}
          <span>{title}</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            to="/list/inbox"
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
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/unfinished" element={<UnfinishedPage />} />
          <Route path="/list/:listId" element={<ProblemPage />} />
          <Route path="/list/:listId/problem/:problemId" element={<ProblemPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
