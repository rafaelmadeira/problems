import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import type { Problem } from '../types';

export default function ListsPage() {
    const { state, reorderLists, setCreateListModalOpen } = useStore();
    const navigate = useNavigate();
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const visibleLists = state.lists.filter(l => l.id !== 'inbox');

    const countProblems = (problems: Problem[]): number => {
        let count = 0;
        for (const p of problems) {
            if (!p.completed) count += 1;
            count += countProblems(p.subproblems);
        }
        return count;
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragEnter = (targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) return;
        const newVisibleLists = [...visibleLists];
        const draggedItem = newVisibleLists[draggedIndex];
        newVisibleLists.splice(draggedIndex, 1);
        newVisibleLists.splice(targetIndex, 0, draggedItem);
        // Inbox is usually first in state.lists but filtered out here.
        // We need to preserve inbox position or find it.
        const inboxList = state.lists.find(l => l.id === 'inbox');
        const newFullLists = inboxList ? [inboxList, ...newVisibleLists] : newVisibleLists;

        reorderLists(newFullLists);
        setDraggedIndex(targetIndex);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    if (visibleLists.length === 0) {
        return (
            <div style={{ padding: '2rem 1rem', paddingBottom: '6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Lists</h1>
                    <button
                        onClick={() => setCreateListModalOpen(true)}
                        style={{
                            background: '#f0f0f0',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div style={{ textAlign: 'center', color: '#888', marginTop: '4rem' }}>
                    <p>No custom lists yet.</p>
                    <button
                        onClick={() => setCreateListModalOpen(true)}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Create your first list
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1rem', paddingTop: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Lists</h1>
                <button
                    onClick={() => setCreateListModalOpen(true)}
                    style={{
                        background: '#f0f0f0',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#333'
                    }}
                >
                    <Plus size={20} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {visibleLists.map((list, index) => {
                    const count = countProblems(list.problems);

                    return (
                        <div
                            key={list.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => navigate(`/list/${list.id}`)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                backgroundColor: '#fff',
                                borderBottom: '1px solid #f0f0f0',
                                cursor: 'pointer',
                                opacity: draggedIndex === index ? 0.5 : 1
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {list.emoji ? (
                                    <span style={{ fontSize: '1.25rem' }}>{list.emoji}</span>
                                ) : (
                                    <CheckCircle2 size={24} color="#ddd" />
                                )}
                                <span style={{ fontSize: '1.1rem', fontWeight: '500', color: '#111' }}>{list.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888' }}>
                                {count > 0 && <span style={{ fontSize: '0.9rem' }}>{count}</span>}
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

