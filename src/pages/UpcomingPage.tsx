import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight, ChevronRight as ChevronRightIcon, MoreHorizontal } from 'lucide-react';
import type { Problem } from '../types';

interface FlatTask {
    problem: Problem;
    listId: string;
    path: { id: string, name: string, type: 'list' | 'problem' }[];
}

function SimpleTaskItem({
    task,
    navigate,
    toggleComplete,
    solvedMessages
}: {
    task: FlatTask,
    navigate: (path: string) => void,
    toggleComplete: (p: Problem, listId: string) => void,
    solvedMessages: { [key: string]: boolean }
}) {
    const { problem, listId, path } = task;
    const [isHovered, setIsHovered] = React.useState(false);

    const countIncompleteSubproblems = (p: Problem): number => {
        let count = 0;
        for (const sub of p.subproblems) {
            if (!sub.completed) count++;
            count += countIncompleteSubproblems(sub);
        }
        return count;
    };

    const subtaskCount = countIncompleteSubproblems(problem);

    return (
        <div
            onClick={() => navigate(`/list/${listId}/problem/${problem.id}`)}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                borderRadius: '8px',
                backgroundColor: isHovered ? '#f9f9f9' : 'transparent',
                opacity: problem.completed ? (isHovered ? 1 : 0.5) : 1,
                transition: 'background-color 0.2s',
                position: 'relative'
            }}
            onMouseEnter={() => {
                setIsHovered(true);
            }}
            onMouseLeave={() => {
                setIsHovered(false);
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
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
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                        onMouseDown={(e) => e.stopPropagation()}
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

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{
                        fontSize: '1rem',
                        color: '#333',
                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                        lineHeight: '1.4',
                        textDecoration: problem.completed ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {problem.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                        {path.map((crumb, index) => {
                            const linkPath = crumb.type === 'list'
                                ? `/list/${crumb.id}`
                                : `/list/${listId}/problem/${crumb.id}`;

                            return (
                                <React.Fragment key={index}>
                                    {index > 0 && <ChevronRightIcon size={10} />}
                                    <Link
                                        to={linkPath}
                                        onClick={(e) => e.stopPropagation()}
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
                </div>
            </div>

            {/* Right side: Badge + Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                {subtaskCount > 0 && (
                    <span style={{
                        backgroundColor: '#e5e5e5',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#555'
                    }}>
                        {subtaskCount}
                    </span>
                )}
                <div style={{ position: 'relative' }}>
                    <button
                        title="Menu"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#ccc',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#888'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
                    >
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UpcomingPage() {
    const { state, updateProblem } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});

    const getUpcomingTasks = (): Record<string, FlatTask[]> => {
        const tasks: FlatTask[] = [];

        // Helper: Check if date is in the future (tomorrow onwards)
        // Actually user said "tasks with due dates in the future".
        // Usually "Today" covers today. "Upcoming" implies future?
        // Let's assume Upcoming means "due date >= tomorrow".
        // Wait, "Today" page shows "Today" priority.
        // If a task has due date today, it should probably be in Today?
        // User request: "tasks that have a due date set... grouped by date headings".
        // Clarification: "tasks with due dates in the future && that are unsolved".
        // I will interpret "future" as ">= tomorrow" to avoid overlap with "Today" page logic if that exists, 
        // BUT user might want to see EVERYTHING upcoming including today if they checked it?
        // Actually, standards usually mean Upcoming includes Today.
        // However, standard GTD: Today is separate.
        // Let's stick to strict interpretation: Future = Date > Today (Date >= Tomorrow).
        // Let's use strict > Today.

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        // We compare against end of today maybe? Or start of tomorrow?
        // Any date > today's date string.

        // Simple string comparison works for ISO dates (YYYY-MM-DD) if they are valid.
        // Let's rely on date objects to be safe.

        const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time approx

        const traverse = (problems: Problem[], listId: string, currentPath: { id: string, name: string, type: 'list' | 'problem' }[]) => {
            for (const p of problems) {
                if (!p.completed && p.dueDate) {
                    if (p.dueDate > todayStr) {
                        tasks.push({
                            problem: p,
                            listId: listId,
                            path: currentPath
                        });
                    }
                }
                const newPath = [...currentPath, { id: p.id, name: p.name, type: 'problem' as const }];
                traverse(p.subproblems, listId, newPath);
            }
        };

        for (const list of state.lists) {
            traverse(list.problems, list.id, [{ id: list.id, name: list.name, type: 'list' }]);
        }

        // Sort by date
        tasks.sort((a, b) => a.problem.dueDate!.localeCompare(b.problem.dueDate!));

        // Group by date
        const grouped: Record<string, FlatTask[]> = {};
        for (const t of tasks) {
            const date = t.problem.dueDate!;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(t);
        }

        return grouped;
    };

    const groupedTasks = getUpcomingTasks();
    const sortedDates = Object.keys(groupedTasks).sort();
    const totalCount = Object.values(groupedTasks).reduce((acc, tasks) => acc + tasks.length, 0);

    useEffect(() => {
        document.title = `Upcoming problems (${totalCount})`;
    }, [totalCount]);


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

    if (totalCount === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <h2>No problems here.</h2>
                <p>And Alexander wept, for there were no more problems to solve.</p>
            </div>
        );
    }

    const formatDateHeading = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00'); // midday to avoid timezone shift
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
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
                <span style={{ fontWeight: 600, color: '#333' }}>Upcoming</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, marginBottom: '0.5rem' }}>Upcoming</h1>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.875rem' }}>
                        Problems due tomorrow and beyond
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {sortedDates.map(date => (
                    <div key={date}>
                        <h2 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#333',
                            borderBottom: '1px solid #eee',
                            paddingBottom: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            {formatDateHeading(date)}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {groupedTasks[date].map(t => (
                                <SimpleTaskItem
                                    key={t.problem.id}
                                    task={t}
                                    navigate={navigate}
                                    toggleComplete={toggleComplete}
                                    solvedMessages={solvedMessages}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
