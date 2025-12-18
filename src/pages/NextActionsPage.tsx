import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, MoreHorizontal } from 'lucide-react';
import type { Problem } from '../types';



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
    const [isHovered, setIsHovered] = useState(false);

    // Match if it's a leaf node (no children)
    // NOTE: In the page logic we filter for problems that have NO subproblems or subproblems are completed?
    // User definition: "tasks that have no children".
    // So if subproblems.length === 0, it's a leaf.


    // We only traverse down if there's a match below. 
    // The filtering logic in the parent component ensures we only render nodes that are part of a matching branch.

    const isMatch = (p: Problem): boolean => {
        if (p.completed) return false;
        // Match if it has no incomplete children
        return p.subproblems.filter(sub => !sub.completed).length === 0;
    };

    const hasMatchingDescendants = (p: Problem): boolean => {
        if (isMatch(p)) return true;
        return p.subproblems.some(child => hasMatchingDescendants(child));
    };

    const isSelfMatch = isMatch(problem);

    // If it is NOT a self match (meaning it is a parent), we dim it.
    // If it IS a self match (meaning it is a leaf to do), we show it fully.
    const isDimmed = !isSelfMatch;
    const finalOpacity = isDimmed && !isHovered ? 0.5 : 1;

    const isExpanded = expandedIds[problem.id] || false;
    const hasChildrenToRender = problem.subproblems.some(child => hasMatchingDescendants(child));


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
                    transition: 'background-color 0.2s, opacity 0.2s',
                    borderRadius: '8px',
                    opacity: finalOpacity
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                    setIsHovered(true);
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    setIsHovered(false);
                }}
            >
                {/* Expander */}
                {hasChildrenToRender ? (
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
                        color: '#333',
                        fontWeight: problem.name.endsWith('!') ? 'bold' : 'normal',
                        lineHeight: '1.4'
                    }}>
                        {problem.name}
                    </div>

                    {/* Line 2: Priority - Due Date */}
                    {(problem.priority || problem.dueDate) && (
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
            {isExpanded && hasChildrenToRender && (
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

export default function NextActionsPage() {
    const { state, updateProblem } = useStore();
    const navigate = useNavigate();
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

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const isMatch = (p: Problem): boolean => {
        if (p.completed) return false;
        // Match if it has no incomplete children
        return p.subproblems.filter(sub => !sub.completed).length === 0;
    };

    const hasMatchingDescendants = (p: Problem): boolean => {
        if (isMatch(p)) return true;
        return p.subproblems.some(child => hasMatchingDescendants(child));
    };

    // Filter lists
    const visibleLists = state.lists.filter(list =>
        list.problems.some(p => hasMatchingDescendants(p))
    );

    // Default expand all that have matches on mount
    useEffect(() => {
        // Expand logic: if a problem has matching descendants, expand it by default?
        // User didn't specify, but for tree views usually nice to expand to show leaves.
        // Let's reuse expandAll logic
        expandAll();
    }, []); // Run once on mount

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

    // Expand/Collapse All Logic
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
                <h2>No next actions!</h2>
                <p>You're all caught up or need to break down some problems.</p>
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
                <span style={{ fontWeight: 600, color: '#333' }}>Next Actions</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Next Actions</h1>

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
                                    fontSize: '0.875rem',
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
        </div>
    );
}
