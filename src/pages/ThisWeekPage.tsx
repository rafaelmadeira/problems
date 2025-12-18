import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, MoreHorizontal } from 'lucide-react';
import type { Problem } from '../types';

interface FlatTask {
    problem: Problem;
    listId: string;
    path: { id: string, name: string, type: 'list' | 'problem' }[];
}

/* 
  Recursive component for rendering a task and its children 
*/
const InternalTaskNode = ({
    problem,
    listId,
    depth,
    toggleComplete,
    solvedMessages,
    expandedIds,
    onToggleExpand
}: {
    problem: Problem,
    listId: string,
    depth: number,
    toggleComplete: (p: Problem, listId: string) => void,
    solvedMessages: { [key: string]: boolean },
    expandedIds: { [key: string]: boolean },
    onToggleExpand: (id: string) => void
}) => {
    const navigate = useNavigate();

    // Helper: Is date in current week (Monday to Sunday)?
    const isDateInCurrentWeek = (dateStr: string | null): boolean => {
        if (!dateStr) return false;
        const now = new Date();
        const currentDay = now.getDay();
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

    const isMatch = (p: Problem): boolean => {
        if (p.completed) return false;
        const isPriorityHelper = p.priority === 'today' || p.priority === 'this_week';
        const isDueHelper = isDateInCurrentWeek(p.dueDate);
        return isPriorityHelper || isDueHelper;
    };

    const hasMatchingDescendants = (p: Problem): boolean => {
        if (isMatch(p)) return true;
        return p.subproblems.some(child => hasMatchingDescendants(child));
    };

    const isSelfMatch = isMatch(problem);
    const hasChildrenMatch = problem.subproblems.some(child => hasMatchingDescendants(child));

    if (!isSelfMatch && !hasChildrenMatch) return null;

    const isExpanded = expandedIds[problem.id] || false;

    return (
        <div style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/list/${listId}/problem/${problem.id}`);
                }}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    borderRadius: '8px',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {/* Expander */}
                {hasChildrenMatch ? (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(problem.id);
                        }}
                        style={{ padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', marginTop: '4px' }}
                    >
                        {isExpanded ? <ChevronDown size={16} color="#888" /> : <ChevronRightIcon size={16} color="#888" />}
                    </div>
                ) : (
                    // Indent spacer if no chilren mechanism
                    <div style={{ width: 20 }} />
                )}

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

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {/* Line 1: Name */}
                    <div style={{
                        fontSize: '1rem',
                        color: isSelfMatch ? '#333' : '#999',
                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                        lineHeight: '1.4'
                    }}>
                        {problem.name}
                    </div>

                    {/* Line 2: Priority - Due Date */}
                    {isSelfMatch && (problem.priority || problem.dueDate) && (
                        <div style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {problem.priority && (
                                <span style={{ textTransform: 'capitalize' }}>
                                    {problem.priority.replace('_', ' ')}
                                </span>
                            )}
                            {problem.priority && problem.dueDate && <span>&middot;</span>}
                            {problem.dueDate && (
                                <span>Due {problem.dueDate}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Recursion */}
            {isExpanded && hasChildrenMatch && (
                <div>
                    {problem.subproblems.map(child => (
                        <InternalTaskNode
                            key={child.id}
                            problem={child}
                            listId={listId}
                            depth={depth + 1}
                            toggleComplete={toggleComplete}
                            solvedMessages={solvedMessages}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function ThisWeekPage() {
    const { state, updateProblem } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});
    const [expandedIds, setExpandedIds] = useState<{ [id: string]: boolean }>({});
    const [menuOpen, setMenuOpen] = useState(false);
    const [showSolved, setShowSolved] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Helper: Is date in current week
    const isDateInCurrentWeek = (dateStr: string | null): boolean => {
        if (!dateStr) return false;
        const now = new Date();
        const currentDay = now.getDay();
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

    const isMatch = (p: Problem): boolean => {
        if (p.completed) return false;
        const isPriorityHelper = p.priority === 'today' || p.priority === 'this_week';
        const isDueHelper = isDateInCurrentWeek(p.dueDate);
        return isPriorityHelper || isDueHelper;
    };

    const hasMatchingDescendants = (p: Problem): boolean => {
        if (isMatch(p)) return true;
        return p.subproblems.some(child => hasMatchingDescendants(child));
    };

    // Filter lists
    const visibleLists = state.lists.filter(list =>
        list.problems.some(p => hasMatchingDescendants(p))
    );

    const getSolvedThisWeekTasks = (): FlatTask[] => {
        const tasks: FlatTask[] = [];
        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const traverse = (problems: Problem[], listId: string, currentPath: { id: string, name: string, type: 'list' | 'problem' }[]) => {
            for (const p of problems) {
                if (p.completed && p.completedAt && p.completedAt >= monday.getTime()) {
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
    const solvedThisWeekTasks = getSolvedThisWeekTasks();

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

    // Expand/Collapse All Logic - Adapted for new structure
    const getAllCollapsibleIds = (): string[] => {
        const ids: string[] = [];

        const traverse = (p: Problem) => {
            if (p.subproblems.some(child => hasMatchingDescendants(child))) {
                ids.push(p.id);
            }
            p.subproblems.forEach(traverse);
        };

        const hasMatchingDescendantsMain = (p: Problem): boolean => {
            if (isMatch(p)) return true;
            return p.subproblems.some(child => hasMatchingDescendantsMain(child));
        };

        for (const list of state.lists) {
            if (list.problems.some(p => hasMatchingDescendantsMain(p))) {
                ids.push(list.id);
                // Also traverse items for their expandability
                list.problems.forEach(traverse);
            }
        }
        return ids;
    };

    const collapseAll = () => {
        setExpandedIds({});
        setMenuOpen(false);
    };

    const expandAll = () => {
        const allIds = getAllCollapsibleIds();
        const newExpanded: { [id: string]: boolean } = {};
        for (const id of allIds) newExpanded[id] = true;
        setExpandedIds(newExpanded);
        setMenuOpen(false);
    };

    // Determine button states
    const allIds = getAllCollapsibleIds();
    let anyExpanded = false;
    let anyCollapsed = false;
    for (const id of allIds) {
        if (expandedIds[id]) anyExpanded = true;
        else anyCollapsed = true;
    }
    const canCollapseAll = anyExpanded;
    const canExpandAll = anyCollapsed;


    if (visibleLists.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <h2>No tasks for this week!</h2>
                <p>Looks like you're ahead of schedule.</p>
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
                <span style={{ fontWeight: 600, color: '#333' }}>This Week</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, marginBottom: '0.5rem' }}>This Week</h1>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.875rem' }}>
                        Problems due this week or with Priority: This Week
                    </p>
                </div>

                {/* Menu Button */}
                <div ref={menuRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#555',
                            transition: 'background-color 0.2s',
                            backgroundColor: menuOpen ? '#eee' : 'transparent'
                        }}
                    >
                        <MoreHorizontal size={24} />
                    </button>

                    {menuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            border: '1px solid #eee',
                            minWidth: '180px',
                            zIndex: 50,
                            overflow: 'hidden',
                            padding: '4px'
                        }}>
                            <button
                                onClick={collapseAll}
                                disabled={!canCollapseAll}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '0.95rem',
                                    color: !canCollapseAll ? '#ccc' : '#333',
                                    cursor: !canCollapseAll ? 'default' : 'pointer',
                                    borderRadius: '8px',
                                }}
                                onMouseEnter={(e) => { if (canCollapseAll) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                                onMouseLeave={(e) => { if (canCollapseAll) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                Collapse all
                            </button>
                            <button
                                onClick={expandAll}
                                disabled={!canExpandAll}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '0.95rem',
                                    color: !canExpandAll ? '#ccc' : '#333',
                                    cursor: !canExpandAll ? 'default' : 'pointer',
                                    borderRadius: '8px',
                                }}
                                onMouseEnter={(e) => { if (canExpandAll) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                                onMouseLeave={(e) => { if (canExpandAll) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                Expand all
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {visibleLists.map(list => {
                    const isExpanded = expandedIds[list.id] || false;

                    const countMatching = (problems: Problem[]): number => {
                        let c = 0;
                        for (const p of problems) {
                            if (isMatch(p)) c++;
                            c += countMatching(p.subproblems);
                        }
                        return c;
                    };
                    const matchCount = countMatching(list.problems);

                    return (
                        <div key={list.id}>
                            <div
                                onClick={() => toggleExpand(list.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    marginBottom: '1rem',
                                    userSelect: 'none'
                                }}
                            >
                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRightIcon size={20} />}
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>{list.name}</h2>
                                <span style={{ color: '#888', fontSize: '0.9rem', fontWeight: 'normal' }}>({matchCount})</span>
                            </div>

                            {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {list.problems
                                        .filter(p => hasMatchingDescendants(p))
                                        .map(p => (
                                            <InternalTaskNode
                                                key={p.id}
                                                problem={p}
                                                listId={list.id}
                                                depth={0}
                                                toggleComplete={toggleComplete}
                                                solvedMessages={solvedMessages}
                                                expandedIds={expandedIds}
                                                onToggleExpand={toggleExpand}
                                            />
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {solvedThisWeekTasks.length > 0 && (
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
                            fontSize: '0.95rem',
                            fontWeight: 'normal',
                            cursor: 'pointer',
                            padding: '0.5rem 0'
                        }}
                    >
                        <span style={{ transform: showSolved ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex' }}>
                            <ChevronRightIcon size={16} />
                        </span>
                        {solvedThisWeekTasks.length} problems solved this week
                    </button>

                    {showSolved && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                            {solvedThisWeekTasks.map(t => (
                                <SimpleTaskItem
                                    key={t.problem.id}
                                    task={t}
                                    navigate={navigate}
                                    toggleComplete={toggleComplete}
                                    solvedMessages={solvedMessages}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
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

    return (
        <div
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
                opacity: problem.completed ? (isHovered ? 1 : 0.5) : 1,
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
                    lineHeight: '1.4',
                    textDecoration: problem.completed ? 'line-through' : 'none',
                }}>
                    {problem.name}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem', color: '#888' }}
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
                                    {index > 0 && <ChevronRightIcon size={12} />}
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
                </div>
            </div>
        </div>
    );
}
