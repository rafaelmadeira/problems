import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronRight, Plus, CheckCircle2 } from 'lucide-react';
import type { Problem } from '../types';

export default function ProblemPage() {
    const { listId, problemId } = useParams();
    const { state, addProblem, updateProblem } = useStore();

    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // 1. Find the List
    const list = state.lists.find(l => l.id === listId);

    // 2. Find the Problem and Path (if problemId exists)
    // Helper to find path: returns array of Problems + the target Problem
    const findPath = (problems: Problem[], targetId: string, currentPath: Problem[] = []): Problem[] | null => {
        for (const p of problems) {
            if (p.id === targetId) {
                return [...currentPath, p];
            }
            const found = findPath(p.subproblems, targetId, [...currentPath, p]);
            if (found) return found;
        }
        return null;
    };

    if (!list) return <div style={{ padding: '2rem' }}>List not found</div>;

    let currentProblem: Problem | null = null;
    let breadcrumbs: Problem[] = [];

    if (problemId) {
        breadcrumbs = findPath(list.problems, problemId) || [];
        if (breadcrumbs.length > 0) {
            currentProblem = breadcrumbs[breadcrumbs.length - 1];
        }
    }

    // If problemId provided but not found
    if (problemId && !currentProblem) {
        return <div style={{ padding: '2rem' }}>Problem not found</div>;
    }

    // 3. Determine View Data
    // If no problemId, we are at List root
    const title = currentProblem ? currentProblem.name : list.name;
    const description = currentProblem ? currentProblem.notes : list.description;
    const subElements = currentProblem ? currentProblem.subproblems : list.problems;
    // For List Root, parentId is null. For Problem, parentId is currentProblem.id
    const currentParentId = currentProblem ? currentProblem.id : null;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtaskName.trim()) {
            addProblem(currentParentId, list.id, newSubtaskName.trim());
            setNewSubtaskName('');
            setIsAdding(false);
        }
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (currentProblem) {
            updateProblem(list.id, currentProblem.id, { notes: e.target.value });
        }
    };

    // Toggle complete?
    const toggleComplete = (p: Problem) => {
        updateProblem(list.id, p.id, { completed: !p.completed });
    };

    return (
        <div>
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#888', fontSize: '0.9rem' }}>
                <Link to="/" style={{ color: 'inherit' }}>Home</Link>
                <ChevronRight size={14} />
                <Link to={`/list/${list.id}`} style={{ fontWeight: !currentProblem ? 'bold' : 'normal', color: !currentProblem ? '#333' : 'inherit' }}>
                    {list.name}
                </Link>
                {breadcrumbs.slice(0, -1).map(p => (
                    <React.Fragment key={p.id}>
                        <ChevronRight size={14} />
                        <Link to={`/list/${list.id}/problem/${p.id}`}>{p.name}</Link>
                    </React.Fragment>
                ))}
                {currentProblem && (
                    <>
                        <ChevronRight size={14} />
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{currentProblem.name}</span>
                    </>
                )}
            </nav>

            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', wordBreak: 'break-word' }}>
                    {title}
                </h1>
                {currentProblem ? (
                    <textarea
                        value={description || ''}
                        onChange={handleNotesChange}
                        placeholder="Notes..."
                        maxLength={500}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            fontSize: '1rem',
                            color: '#555',
                            resize: 'none',
                            lineHeight: '1.6'
                        }}
                    />
                ) : (
                    <p style={{ color: '#555', lineHeight: '1.6' }}>{description}</p>
                )}
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {subElements.map(child => {
                    const childCount = child.subproblems.length;
                    return (
                        <div
                            key={child.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                borderBottom: '1px solid #f0f0f0'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button
                                    onClick={() => toggleComplete(child)}
                                    style={{ color: child.completed ? '#22c55e' : '#e5e5e5' }}
                                >
                                    <CheckCircle2 size={24} fill={child.completed ? "#22c55e" : "transparent"} color={child.completed ? "#fff" : "#e5e5e5"} />
                                </button>
                                <Link
                                    to={`/list/${list.id}/problem/${child.id}`}
                                    style={{
                                        fontSize: '1.1rem',
                                        textDecoration: child.completed ? 'line-through' : 'none',
                                        color: child.completed ? '#aaa' : '#333',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {child.name}
                                </Link>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {childCount > 0 && (
                                    <span style={{
                                        color: '#888',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}>
                                        {childCount} subtasks
                                    </span>
                                )}
                                <Link to={`/list/${list.id}/problem/${child.id}`}>
                                    <ChevronRight size={20} color="#e5e5e5" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '2rem' }}>
                {isAdding ? (
                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="New task..."
                            value={newSubtaskName}
                            onChange={e => setNewSubtaskName(e.target.value)}
                            style={{
                                fontSize: '1.1rem',
                                borderBottom: '2px solid #333',
                                padding: '0.5rem',
                                flex: 1
                            }}
                            onBlur={() => !newSubtaskName && setIsAdding(false)}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#333',
                                color: '#fff',
                                borderRadius: '8px',
                                fontWeight: '600'
                            }}
                        >
                            Add
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#888',
                            padding: '0.5rem 0'
                        }}
                    >
                        <Plus size={20} />
                        <span>New task</span>
                    </button>
                )}
            </div>

        </div>
    );
}
