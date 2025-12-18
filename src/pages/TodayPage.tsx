import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronRight } from 'lucide-react';
import type { Problem } from '../types';
import CheckButton from '../components/CheckButton';

interface FlatTask {
    problem: Problem;
    listId: string;
    path: { id: string, name: string, type: 'list' | 'problem' }[];
}

// Helpers
const isOverdue = (p: Problem): boolean => {
    if (p.completed || !p.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = p.dueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    return due < today;
};

const isDueToday = (p: Problem): boolean => {
    if (p.completed || !p.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = p.dueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    return due.getTime() === today.getTime();
};

const isDoToday = (p: Problem): boolean => {
    if (p.completed) return false;
    return p.priority === 'today';
};

const formatDuration = (ms: number): string => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
};

export default function TodayPage() {
    const { state, updateProblem, reorderTodayProblems } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});
    const [showSolved, setShowSolved] = useState(false);

    // START: DnD Local State
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Helpers


    // Flatten logic
    const getAllTasks = (): FlatTask[] => {
        const tasks: FlatTask[] = [];

        const traverse = (problems: Problem[], listId: string, currentPath: { id: string, name: string, type: 'list' | 'problem' }[]) => {
            for (const p of problems) {
                if (!p.completed) {
                    if (isOverdue(p) || isDueToday(p) || isDoToday(p)) {
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

        return tasks;
    };

    const getSolvedTodayTasks = (): FlatTask[] => {
        const tasks: FlatTask[] = [];
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const traverse = (problems: Problem[], listId: string, currentPath: { id: string, name: string, type: 'list' | 'problem' }[]) => {
            for (const p of problems) {
                if (p.completed && p.completedAt && p.completedAt >= todayStart.getTime()) {
                    tasks.push({
                        problem: p,
                        listId: listId,
                        path: currentPath
                    });
                }
                const newPath = [...currentPath, { id: p.id, name: p.name, type: 'problem' as const }];
                traverse(p.subproblems, listId, newPath);
            }
        };

        for (const list of state.lists) {
            traverse(list.problems, list.id, [{ id: list.id, name: list.name, type: 'list' }]);
        }
        return tasks;
    };

    const allTasks = getAllTasks();
    const solvedTodayTasks = getSolvedTodayTasks();
    const overdueTasks = allTasks.filter(t => isOverdue(t.problem));
    const dueTodayTasks = allTasks.filter(t => isDueToday(t.problem));

    useEffect(() => {
        document.title = `Today's problems (${allTasks.length})`;
    }, [allTasks.length]);

    // Base Do Today (from Store)
    const doTodayTasks = allTasks
        .filter(t => isDoToday(t.problem))
        .sort((a, b) => {
            const orderA = a.problem.todayOrder ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.problem.todayOrder ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });

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

    // DnD Handlers (Direct Store Update - Matching ProblemPage)
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragEnter = (targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        // Perform reorder
        const newItems = [...doTodayTasks];
        const draggedItem = newItems[draggedIndex];

        // Remove dragged item
        newItems.splice(draggedIndex, 1);
        // Insert at new position
        newItems.splice(targetIndex, 0, draggedItem);

        // Commit immediately to store
        // We construct the payload for ALL items in the new order
        // This effectively updates 'todayOrder' for everyone
        const reorderPayload = newItems.map((t) => ({
            id: t.problem.id,
            listId: t.listId
        }));

        reorderTodayProblems(reorderPayload);
        setDraggedIndex(targetIndex);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const hasAnyContent = overdueTasks.length > 0 || dueTodayTasks.length > 0 || doTodayTasks.length > 0;

    if (!hasAnyContent) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <h2 style={{ padding: '1rem', color: '#333' }}>No problems here.</h2>
                <p style={{ fontStyle: 'italic' }}>And Alexander wept, for there were no more problems to solve.</p>
            </div>
        );
    }



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
                <span style={{ fontWeight: 600, color: '#333' }}>Today</span>
            </nav>

            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Today</h1>
            <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.875rem' }}>
                Problems due today or with Priority: Today
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                {overdueTasks.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#333' }}>
                            Overdue
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {overdueTasks.map(t => (
                                <TaskItemInline
                                    key={t.problem.id}
                                    task={t}
                                    navigate={navigate}
                                    toggleComplete={toggleComplete}
                                    solvedMessages={solvedMessages}
                                    draggedIndex={draggedIndex}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {dueTodayTasks.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#333' }}>
                            Due Today
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {dueTodayTasks.map(t => (
                                <TaskItemInline
                                    key={t.problem.id}
                                    task={t}
                                    navigate={navigate}
                                    toggleComplete={toggleComplete}
                                    solvedMessages={solvedMessages}
                                    draggedIndex={draggedIndex}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {doTodayTasks.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#333' }}>
                            Do Today
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {doTodayTasks.map((t, index) => (
                                <TaskItemInline
                                    key={t.problem.id}
                                    task={t}
                                    isDraggable={true}
                                    index={index}
                                    onDragStart={handleDragStart}
                                    onDragEnter={handleDragEnter}
                                    onDragEnd={handleDragEnd}
                                    navigate={navigate}
                                    toggleComplete={toggleComplete}
                                    solvedMessages={solvedMessages}
                                    draggedIndex={draggedIndex}
                                />
                            ))}
                        </div>
                    </section>
                )}

            </div>

            {solvedTodayTasks.length > 0 && (
                <div style={{ marginTop: '3rem' }}>
                    <button
                        onClick={() => setShowSolved(!showSolved)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            fontSize: '0.875rem',
                            fontWeight: 'normal',
                            cursor: 'pointer',
                            padding: '0.5rem 0'
                        }}
                    >
                        <span style={{ transform: showSolved ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex' }}>
                            <ChevronRight size={16} />
                        </span>
                        {solvedTodayTasks.length} problems solved today
                    </button>

                    {showSolved && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                            {solvedTodayTasks.map(t => (
                                <TaskItemInline
                                    key={t.problem.id}
                                    task={t}
                                    navigate={navigate}
                                    toggleComplete={toggleComplete}
                                    solvedMessages={solvedMessages}
                                    draggedIndex={draggedIndex}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

function TaskItemInline({
    task,
    isDraggable,
    index,
    onDragStart,
    onDragEnter,
    onDragEnd,
    navigate,
    toggleComplete,
    solvedMessages,
    draggedIndex
}: {
    task: FlatTask,
    isDraggable?: boolean,
    index?: number,
    onDragStart?: (i: number) => void,
    onDragEnter?: (i: number) => void,
    onDragEnd?: () => void,
    navigate: (path: string) => void,
    toggleComplete: (p: Problem, listId: string) => void,
    solvedMessages: { [key: string]: boolean },
    draggedIndex: number | null
}) {
    const { problem, listId, path } = task;
    const isDraggingThis = isDraggable && index !== undefined && index === draggedIndex;
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            draggable={isDraggable}
            onDragStart={() => isDraggable && onDragStart && index !== undefined && onDragStart(index)}
            onDragEnter={() => isDraggable && onDragEnter && index !== undefined && onDragEnter(index)}
            onDragEnd={onDragEnd}
            onDragOver={e => e.preventDefault()}
            onClick={() => navigate(`/list/${listId}/problem/${problem.id}`)}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#fff',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                borderRadius: '8px',
                opacity: problem.completed ? (isHovered ? 1 : 0.5) : (isDraggingThis ? 0.5 : 1),
                transition: 'opacity 0.2s, background-color 0.2s'
            }}
            onMouseEnter={(e) => {
                setIsHovered(true);
                e.currentTarget.style.backgroundColor = '#f9f9f9';
            }}
            onMouseLeave={(e) => {
                setIsHovered(false);
                e.currentTarget.style.backgroundColor = '#fff';
            }}
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
                <CheckButton
                    completed={problem.completed}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(problem, listId);
                    }}
                    size={24}
                />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: '1rem',
                    color: '#333',
                    textDecoration: problem.completed ? 'line-through' : 'none',
                    fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                    lineHeight: '1.4'
                }}>
                    {problem.name}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem', color: '#888' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {crumb.name}
                                    </Link>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {(problem.dueDate || problem.estimatedDuration) && (
                        <>
                            <span>&middot;</span>
                            {problem.dueDate && (
                                <span style={{
                                    color: isOverdue(problem) ? '#ef4444' : 'inherit',
                                    fontWeight: isOverdue(problem) || isDueToday(problem) ? 'bold' : 'normal',
                                    marginRight: problem.estimatedDuration ? '0.5rem' : 0
                                }}>
                                    Due {problem.dueDate}
                                </span>
                            )}
                            {problem.estimatedDuration && (
                                <span style={{ color: '#888' }}>
                                    {formatDuration(problem.estimatedDuration)}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
