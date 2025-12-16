import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, MoreHorizontal } from 'lucide-react';
import type { Problem } from '../types';

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

    const hasUnfinishedDescendants = (p: Problem): boolean => {
        if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) return true;
        return p.subproblems.some(child => hasUnfinishedDescendants(child));
    };

    const isSelfUnfinished = !problem.completed && (problem.status === 'solving' || problem.status === 'blocked');
    const hasRelevantChildren = problem.subproblems.some(child => hasUnfinishedDescendants(child));

    if (!isSelfUnfinished && !hasRelevantChildren) return null;

    const isExpanded = expandedIds[problem.id] || false;

    // Helper for status label
    const getStatusLabel = (s?: string) => {
        if (s === 'solving') return 'Working on it';
        if (s === 'blocked') return 'Blocked';
        if (s === 'solved') return 'Solved!';
        return 'To Solve';
    };

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
                    backgroundColor: problem.status === 'blocked' ? '#fff1f1' : 'transparent',
                }}
                onMouseEnter={(e) => {
                    if (problem.status !== 'blocked') e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                onMouseLeave={(e) => {
                    if (problem.status !== 'blocked') e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {hasRelevantChildren ? (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(problem.id);
                        }}
                        style={{ padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        {isExpanded ? <ChevronDown size={16} color="#888" /> : <ChevronRightIcon size={16} color="#888" />}
                    </div>
                ) : (
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

                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '1.1rem',
                        color: isSelfUnfinished ? '#333' : '#999',
                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                        lineHeight: '1.4'
                    }}>
                        {problem.name}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>
                            {problem.priority?.replace('_', ' ') || 'someday'}
                        </span>
                        <span>&middot;</span>
                        <span style={{
                            // Removed textTransform: 'capitalize'
                            color: problem.status === 'blocked' ? '#ef4444' :
                                problem.status === 'solving' ? '#3b82f6' : '#888'
                        }}>
                            {getStatusLabel(problem.status)}
                        </span>
                    </div>
                </div>
            </div>

            {isExpanded && hasRelevantChildren && (
                <div>
                    {problem.subproblems
                        .filter(child => hasUnfinishedDescendants(child))
                        .map(child => (
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
                        ))
                    }
                </div>
            )}
        </div>
    );
}

export default function UnfinishedPage() {
    const { state, updateProblem } = useStore();
    const navigate = useNavigate();
    const [solvedMessages, setSolvedMessages] = useState<{ [key: string]: boolean }>({});

    // CHANGED: Default state is empty {} meaning everything is COLLAPSED (because undefined/false = collapsed).
    // Using positive logic "expandedIds".
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

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Helper: Collect ALL IDs (lists and recursive tasks with children)
    const getAllCollapsibleIds = (): string[] => {
        const ids: string[] = [];

        const traverse = (problems: Problem[]) => {
            for (const p of problems) {
                const hasUnfinishedDescendants = (prob: Problem): boolean => {
                    if (!prob.completed && (prob.status === 'solving' || prob.status === 'blocked')) return true;
                    return prob.subproblems.some(child => hasUnfinishedDescendants(child));
                };

                if (p.subproblems.some(child => hasUnfinishedDescendants(child))) {
                    ids.push(p.id);
                }
                traverse(p.subproblems);
            }
        };

        const hasUnfinishedDescendantsMain = (p: Problem): boolean => {
            if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) return true;
            return p.subproblems.some(child => hasUnfinishedDescendantsMain(child));
        };

        for (const list of state.lists) {
            if (list.problems.some(p => hasUnfinishedDescendantsMain(p))) {
                ids.push(list.id);
                traverse(list.problems);
            }
        }

        return ids;
    };

    // Actions - Inverted Logic
    const collapseAll = () => {
        // Set all specific IDs to false or just clear map. Clearing is cleaner (default collapsed).
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

    // Determine disabled states
    const allIds = getAllCollapsibleIds();
    // Default (empty map) = All Collapsed.
    // If ANY ID is true, then we can Collapse All.
    // If ANY ID is false (or missing), then we can Expand All.

    let anyCollapsed = false;
    let anyExpanded = false;

    for (const id of allIds) {
        if (expandedIds[id]) {
            anyExpanded = true;
        } else {
            anyCollapsed = true; // Implicitly collapsed
        }
    }

    // logic naming:
    // canCollapseAll = if there is at least one thing expanded.
    const canCollapseAll = anyExpanded;
    // canExpandAll = if there is at least one thing collapsed.
    const canExpandAll = anyCollapsed;


    const hasUnfinishedDescendants = (p: Problem): boolean => {
        if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) return true;
        return p.subproblems.some(child => hasUnfinishedDescendants(child));
    };

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

    const visibleLists = state.lists.filter(list =>
        list.problems.some(p => hasUnfinishedDescendants(p))
    );

    if (visibleLists.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <h2>No unfinished tasks!</h2>
                <p>You're clear on active work.</p>
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
                <span style={{ fontWeight: 600, color: '#333' }}>Unfinished</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Unfinished</h1>

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

                    const countStrict = (problems: Problem[]): number => {
                        let c = 0;
                        for (const p of problems) {
                            if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) c++;
                            c += countStrict(p.subproblems);
                        }
                        return c;
                    };
                    const unfinishedCount = countStrict(list.problems);

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
                                <span style={{ color: '#888', fontSize: '0.9rem', fontWeight: 'normal' }}>({unfinishedCount})</span>
                            </div>

                            {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {list.problems
                                        .filter(p => hasUnfinishedDescendants(p))
                                        .map(p => (
                                            <InternalTaskNode
                                                key={p.id}
                                                problem={p}
                                                listId={list.id}
                                                depth={0} // Reset depth for children logic inside
                                                // Actually depth was passed to marginLeft
                                                // List level starts at depth 0.
                                                // Wait, TaskNode had default 0.
                                                // Here we call InternalTaskNode directly.
                                                // Let's check depth logic.
                                                // InternalTaskNode uses depth for marginLeft.
                                                // If we start at 0 here, first items have 0 margin. Correct.
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
        </div>
    );
}
