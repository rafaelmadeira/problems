import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { Problem } from '../types';

interface FlatTask {
    problem: Problem;
    listId: string;
    path: { id: string, name: string, type: 'list' | 'problem' }[];
}

export default function ThisWeekPage() {
    const { state, updateProblem } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});

    // Helper: Is date in current week (Monday to Sunday)?
    const isDateInCurrentWeek = (dateStr: string): boolean => {
        if (!dateStr) return false;
        // const d = new Date(dateStr); // Unused
        const now = new Date();

        // Reset hours to compare dates only effectively
        // Actually, let's work with timestamps or just day alignment.
        // Simple way: Get bounds of current week.

        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay; // adjust when day is sunday

        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Adjust the input date to be strictly comparable (ignore local/utc mess if possible, but input is YYYY-MM-DD)
        // YYYY-MM-DD parses as UTC usually in JS, or local depending on browser. 
        // Best to treat dateStr as local date part.
        const [year, month, day] = dateStr.split('-').map(Number);
        const checkDate = new Date(year, month - 1, day); // month is 0-indexed

        return checkDate >= monday && checkDate <= sunday;
    };

    const getWeekTasks = (): FlatTask[] => {
        const tasks: FlatTask[] = [];

        const traverse = (problems: Problem[], listId: string, currentPath: { id: string, name: string, type: 'list' | 'problem' }[]) => {
            for (const p of problems) {
                if (!p.completed) {
                    const isPriorityMatch = p.priority === 'today' || p.priority === 'this_week';
                    const isDueMatch = p.dueDate ? isDateInCurrentWeek(p.dueDate) : false;

                    if (isPriorityMatch || isDueMatch) {
                        tasks.push({
                            problem: p,
                            listId: listId,
                            path: currentPath
                        });
                    }
                }

                // Continue deep traversal
                const newPath = [...currentPath, { id: p.id, name: p.name, type: 'problem' as const }];
                traverse(p.subproblems, listId, newPath);
            }
        };

        for (const list of state.lists) {
            traverse(list.problems, list.id, [{ id: list.id, name: list.name, type: 'list' }]);
        }

        return tasks;
    };

    const weekTasks = getWeekTasks();

    const toggleComplete = (p: Problem, listId: string) => {
        const newCompleted = !p.completed;
        updateProblem(listId, p.id, {
            completed: newCompleted,
            status: newCompleted ? 'solved' : 'to_solve'
        });

        if (newCompleted) {
            setSolvedMessages(prev => ({ ...prev, [p.id]: true }));
            setTimeout(() => {
                setSolvedMessages(prev => {
                    const next = { ...prev };
                    delete next[p.id];
                    return next;
                });
            }, 2000);
        }
    };

    if (weekTasks.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <h2>No tasks for this week!</h2>
                <p>Looks like you're ahead of schedule.</p>
            </div>
        );
    }

    return (
        <div>
            <style>{`
                @keyframes fadeOutUp {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    70% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-15px); }
                }
            `}</style>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#888', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: 'inherit' }}>Home</Link>
                <ChevronRight size={14} />
                <span style={{ fontWeight: 600, color: '#333' }}>This Week</span>
            </nav>

            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>This Week</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {weekTasks.map(({ problem, listId, path }) => (
                    <div
                        key={problem.id}
                        onClick={() => navigate(`/list/${listId}/problem/${problem.id}`)}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '1rem',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            borderRadius: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <div style={{ position: 'relative', paddingTop: '2px' }}>
                            {solvedMessages[problem.id] && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: '#22c55e',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    animation: 'fadeOutUp 2s ease-out forwards',
                                    pointerEvents: 'none',
                                    marginBottom: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    zIndex: 10
                                }}>
                                    Problem solved!
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        borderLeft: '4px solid transparent',
                                        borderRight: '4px solid transparent',
                                        borderTop: '4px solid #22c55e'
                                    }} />
                                </div>
                            )}
                            <button
                                title="solve problem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComplete(problem, listId);
                                }}
                                style={{
                                    color: problem.completed ? '#22c55e' : '#e5e5e5',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0
                                }}
                            >
                                <CheckCircle2 size={24} fill={problem.completed ? "#22c55e" : "transparent"} color={problem.completed ? "#fff" : "#e5e5e5"} />
                            </button>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '1.1rem',
                                color: '#333',
                                fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                                lineHeight: '1.4'
                            }}>
                                {problem.name}
                            </div>

                            {/* Path */}
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#888' }} onClick={e => e.stopPropagation()}>
                                {path.map((crumb, index) => {
                                    const linkPath = crumb.type === 'list'
                                        ? `/list/${crumb.id}`
                                        : `/list/${listId}/problem/${crumb.id}`;

                                    return (
                                        <React.Fragment key={index}>
                                            {index > 0 && <ChevronRight size={12} />}
                                            <Link
                                                to={linkPath}
                                                style={{ color: '#888', textDecoration: 'none', borderBottom: '1px solid transparent' }}
                                                onMouseEnter={e => e.currentTarget.style.borderBottom = '1px solid #888'}
                                                onMouseLeave={e => e.currentTarget.style.borderBottom = '1px solid transparent'}
                                            >
                                                {crumb.name}
                                            </Link>
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Metadata Snippet optionally here? User didn't request, but good practice. Will follow TodayPage style (just path) */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
