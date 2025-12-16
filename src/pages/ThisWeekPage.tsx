import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, MoreHorizontal } from 'lucide-react';
import type { Problem } from '../types';

/* 
  Recursive component for rendering a task and its children 
*/
const TaskNode = ({
    problem,
    listId,
    path, // [NEW] Path prop
    depth = 0,
    toggleComplete,
    solvedMessages,
    expandedIds,
    onToggleExpand
}: {
    problem: Problem,
    listId: string,
    path: { id: string, name: string, type: 'list' | 'problem' }[],
    depth: number,
    toggleComplete: (p: Problem, listId: string) => void,
    solvedMessages: { [key: string]: boolean },
    expandedIds: { [key: string]: boolean },
    onToggleExpand: (id: string, listId: string) => void
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
        return p.subproblems.some(child => isMatch(child) || hasMatchingDescendants(child));
    };

    const isSelfMatch = isMatch(problem);
    const hasChildrenMatch = problem.subproblems.some(child => isMatch(child) || hasMatchingDescendants(child));

    if (!isSelfMatch && !hasChildrenMatch) return null;

    const isExpanded = expandedIds[problem.id] || false;

    // Current path for this node (parent path + self)
    // Actually, for display, we want the path TO this node?
    // User said: "So the task will have 3 lines... line 3: [path]"
    // Usually path excludes self name if title is self name.
    // Let's assume path is Parents.
    // Wait, the path passed in `path` prop is the path TO this node (excluding this node)?
    // Or including?
    // In TodayPage: `const newPath = [...currentPath, { id: p.id, name: p.name, type: 'problem' as const }];`
    // And `currentPath` is passed to traverse.
    // So `path` is the heritage.

    // Line 3: Path styling
    const pathElements = path.map((crumb, index) => {
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
    });

    const currentPath = [...path, { id: problem.id, name: problem.name, type: 'problem' as const }];


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
                            onToggleExpand(problem.id, listId);
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
                        fontSize: '1.1rem',
                        color: isSelfMatch ? '#333' : '#999',
                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                        lineHeight: '1.4'
                    }}>
                        {problem.name}
                    </div>

                    {/* Line 2: Priority - Due Date */}
                    {isSelfMatch && (problem.priority || problem.dueDate) && (
                        <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {problem.priority && (
                                <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                    {problem.priority.replace('_', ' ')}
                                </span>
                            )}
                            {problem.priority && problem.dueDate && <span>-</span>}
                            {problem.dueDate && (
                                <span>Due {problem.dueDate}</span>
                            )}
                        </div>
                    )}

                    {/* Line 3: Path */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', fontSize: '0.8rem', color: '#888' }} onClick={e => e.stopPropagation()}>
                        {pathElements}
                    </div>
                </div>
            </div>

            {/* Recursion */}
            {isExpanded && hasChildrenMatch && (
                <div>
                    {problem.subproblems.map(child => (
                        <TaskNode
                            key={child.id}
                            problem={child}
                            listId={listId}
                            path={currentPath} // Pass cumulative path
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
    // const navigate = useNavigate(); // Unused
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});
    const [expandedIds, setExpandedIds] = useState<{ [id: string]: boolean }>({});
    const [menuOpen, setMenuOpen] = useState(false);
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

    const toggleExpand = (id: string, listId: string) => {
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
        if (p.completed) return false; // if complete, descendants don't matter for this view? Assume yes.
        // Actually, if a completed parent has an incomplete matching child?
        // "This Week" usually implies "Things to do".
        // If parent is checked, usually children are checked.
        // So checking p.completed is safe.
        if (isMatch(p)) return true;
        return p.subproblems.some(child => hasMatchingDescendants(child));
    };

    // Flatten all root problems from all lists
    const allRootProblems = state.lists.flatMap(list =>
        list.problems.map(p => ({ problem: p, listId: list.id, listName: list.name }))
    ).filter(({ problem }) => hasMatchingDescendants(problem));


    // Expand/Collapse All Logic
    const getAllCollapsibleIds = (): string[] => {
        const ids: string[] = [];
        const traverse = (p: Problem) => {
            // If p has relevant children, it is collapsible
            if (p.subproblems.some(child => hasMatchingDescendants(child))) {
                ids.push(p.id);
            }
            p.subproblems.forEach(traverse);
        };

        allRootProblems.forEach(({ problem }) => {
            // Check root itself?
            // Root is "problem".
            traverse(problem);
        });
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

    if (allRootProblems.length === 0) {
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
                <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>This Week</h1>

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allRootProblems.map(({ problem, listId, listName }) => (
                    <TaskNode
                        key={problem.id}
                        problem={problem}
                        listId={listId}
                        path={[{ id: listId, name: listName, type: 'list' }]} // Initial path
                        depth={0}
                        toggleComplete={toggleComplete}
                        solvedMessages={solvedMessages}
                        expandedIds={expandedIds}
                        onToggleExpand={toggleExpand}
                    />
                ))}
            </div>
        </div>
    );
}
