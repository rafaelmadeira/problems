import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useStore } from './context/StoreContext';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage'; // We will create this next
import { CheckCircle2 } from 'lucide-react';

function App() {
  const { state } = useStore();
  const location = useLocation();

  // Calculate total recursive problems (only incomplete)
  const countProblems = (problems: any[]): number => {
    let count = 0;
    for (const p of problems) {
      if (!p.completed) {
        count += 1;
      }
      count += countProblems(p.subproblems);
    }
    return count;
  };

  const totalProblems = state.lists.reduce((acc, list) => {
    return acc + countProblems(list.problems);
  }, 0);

  const title = totalProblems === 0 ? '0 problems' : `${totalProblems} problems`;

  // Calculate Inbox count
  const inboxList = state.lists.find(l => l.id === 'inbox');
  const inboxCount = inboxList ? countProblems(inboxList.problems) : 0;
  const isInboxActive = location.pathname.includes('/list/inbox');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111', textDecoration: 'none' }}>
          {totalProblems === 0 && <CheckCircle2 size={24} color="#22c55e" />}
          <span>{title}</span>
        </Link>
        <Link
          to="/list/inbox"
          style={{
            padding: '0.4rem 0.8rem',
            backgroundColor: isInboxActive ? '#eee' : 'transparent',
            borderRadius: '6px',
            color: isInboxActive ? '#111' : '#666',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isInboxActive) e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            if (!isInboxActive) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>Inbox</span>
          {inboxCount > 0 && (
            <span style={{
              backgroundColor: isInboxActive ? '#ddd' : '#eee',
              padding: '0.1rem 0.5rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              color: '#333'
            }}>
              {inboxCount}
            </span>
          )}
        </Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/list/:listId" element={<ProblemPage />} />
          <Route path="/list/:listId/problem/:problemId" element={<ProblemPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
