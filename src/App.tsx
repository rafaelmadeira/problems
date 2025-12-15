import { Routes, Route, Link } from 'react-router-dom';
import { useStore } from './context/StoreContext';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage'; // We will create this next
import { CheckCircle2 } from 'lucide-react';

function App() {
  const { state } = useStore();

  // Calculate total recursive problems
  const countProblems = (problems: any[]): number => {
    let count = problems.length; // Count these problems
    for (const p of problems) {
      count += countProblems(p.subproblems);
    }
    return count;
  };

  const totalProblems = state.lists.reduce((acc, list) => {
    return acc + countProblems(list.problems);
  }, 0);

  const title = totalProblems === 0 ? '0 problems' : `${totalProblems} problems`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {totalProblems === 0 && <CheckCircle2 size={24} color="#22c55e" />}
          <span>{title}</span>
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
