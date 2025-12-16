import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { Problem } from '../types';

interface FlatTask {
    problem: Problem;
    listId: string;
    path: { id: string, name: string, type: 'list' | 'problem' }[];
}

export default function TodayPage() {
    const { state, updateProblem, reorderTodayProblems } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});

    // START: DnD Local State
    const [localDoTodayTasks, setLocalDoTodayTasks] = useState<FlatTask[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = React.useRef(false); // Ref to track actual drag state for async callbacks

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

    const allTasks = getAllTasks();
    const overdueTasks = allTasks.filter(t => isOverdue(t.problem));
    const dueTodayTasks = allTasks.filter(t => isDueToday(t.problem));

    // Base Do Today (from Store)
    const baseDoTodayTasks = allTasks
        .filter(t => isDoToday(t.problem))
        .sort((a, b) => {
            const orderA = a.problem.todayOrder ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.problem.todayOrder ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });

    // Sync Local State
    useEffect(() => {
        if (!isDragging) {
            setLocalDoTodayTasks(baseDoTodayTasks);
        }
    }, [state.lists, isDragging]); // Sync when store changes OR when drag ends

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

    // DnD Handlers (Local State)
    const handleDragStart = (index: number) => {
        setIsDragging(true);
        isDraggingRef.current = true;

        // Delay to allow browser to capture full-opacity drag image
        setTimeout(() => {
            // Only set dragged index if we are still dragging!
            if (isDraggingRef.current) {
                setDraggedIndex(index);
            }
        }, 0);
    };

    const handleDragEnter = (targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        // Reorder LOCAL state only
        setLocalDoTodayTasks(prev => {
            const items = [...prev];
            const draggedItem = items[draggedIndex];
            items.splice(draggedIndex, 1);
            items.splice(targetIndex, 0, draggedItem);
            return items;
        });

        setDraggedIndex(targetIndex);
    };

    const handleDragEnd = () => {
        isDraggingRef.current = false; // Immediately disable future timeout actions

        // Commit to Store
        const reorderPayload = localDoTodayTasks.map((t) => ({
            id: t.problem.id,
            listId: t.listId
        }));
        reorderTodayProblems(reorderPayload);

        // Reset
        setDraggedIndex(null);
        setIsDragging(false);
    };

    const hasAnyContent = overdueTasks.length > 0 || dueTodayTasks.length > 0 || localDoTodayTasks.length > 0; // check local

    if (!hasAnyContent) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <h2>No tasks for today!</h2>
                <p>You're all caught up.</p>
            </div>
        );
    }

    const TaskItem = ({ task, isDraggable, index, onDragStart, onDragEnter, onDragEnd }: {
        task: FlatTask,
        isDraggable?: boolean,
        index?: number,
        onDragStart?: (i: number) => void,
        onDragEnter?: (i: number) => void,
        onDragEnd?: () => void
    }) => {
        const { problem, listId, path } = task;
        const isDraggingThis = isDraggable && index === draggedIndex;

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
                    cursor: isDraggable ? 'grab' : 'pointer',
                    borderRadius: '8px',
                    opacity: isDraggingThis ? 0 : 1 // Hide original
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
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

                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '1.1rem',
                        color: '#333',
                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                        lineHeight: '1.4'
                    }}>
                        {problem.name}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#888' }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                    >
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
                                        >
                                            {crumb.name}
                                        </Link>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {(problem.priority || problem.dueDate) && (
                            <>
                                <span>&middot;</span>
                                {problem.dueDate && (
                                    <span style={{
                                        color: isOverdue(problem) ? '#ef4444' : 'inherit',
                                        fontWeight: isOverdue(problem) || isDueToday(problem) ? 'bold' : 'normal'
                                    }}>
                                        Due {problem.dueDate}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
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
                <span style={{ fontWeight: 600, color: '#333' }}>Today</span>
            </nav>

            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Today</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                {overdueTasks.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ef4444' }}>
                            Overdue
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {overdueTasks.map(t => (
                                <TaskItem key={t.problem.id} task={t} />
                            ))}
                        </div>
                    </section>
                )}

                {dueTodayTasks.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#f59e0b' }}>
                            Due Today
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {dueTodayTasks.map(t => (
                                <TaskItem key={t.problem.id} task={t} />
                            ))}
                        </div>
                    </section>
                )}

                {localDoTodayTasks.length > 0 && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1368C4' }}>
                            Do Today
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {localDoTodayTasks.map((t, index) => (
                                <TaskItem
                                    key={t.problem.id}
                                    task={t}
                                    isDraggable={true}
                                    index={index}
                                    onDragStart={handleDragStart}
                                    onDragEnter={handleDragEnter}
                                    onDragEnd={handleDragEnd}
                                />
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
