import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppState, List, Problem } from '../types';

interface StoreContextType {
    state: AppState;
    addList: (name: string) => void;
    addProblem: (parentId: string | null, listId: string, data: { name: string, priority: Problem['priority'], dueDate: string | null, notes: string }) => void;
    updateProblem: (listId: string, problemId: string, updates: Partial<Problem>) => void;
    updateList: (listId: string, updates: Partial<List>) => void;
    deleteList: (listId: string) => void;
    deleteProblem: (listId: string, problemId: string) => void;
    reorderLists: (newLists: List[]) => void;
    reorderProblems: (listId: string, parentProblemId: string | null, newProblems: Problem[]) => void;
    reorderTodayProblems: (items: { id: string, listId: string }[]) => void;
    moveProblemToList: (problemId: string, fromListId: string, toListId: string) => void;
    // We might need more specific actions or a generic dispatch
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'problems-app-data';

const defaultState: AppState = {
    lists: [
        {
            id: 'inbox',
            name: 'Inbox',
            description: 'Default list',
            problems: []
        }
    ]
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : defaultState;
    });

    useEffect(() => {
        // Migration: Rename "📥 Inbox" to "Inbox"
        const inbox = state.lists.find(l => l.id === 'inbox');
        if (inbox && inbox.name === '📥 Inbox') {
            setState(prev => ({
                ...prev,
                lists: prev.lists.map(l => l.id === 'inbox' ? { ...l, name: 'Inbox' } : l)
            }));
        }
    }, [state.lists]); // Check when lists change, though essentially runs once on load if needed.

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const addList = (name: string) => {
        const newList: List = {
            id: crypto.randomUUID(),
            name,
            description: '',
            problems: []
        };
        setState(prev => ({
            ...prev,
            lists: [...prev.lists, newList]
        }));
    };

    const findProblemAndAdd = (problems: Problem[], parentId: string, newProblem: Problem): boolean => {
        for (const p of problems) {
            if (p.id === parentId) {
                p.subproblems.push(newProblem);
                return true;
            }
            if (findProblemAndAdd(p.subproblems, parentId, newProblem)) return true;
        }
        return false;
    };

    const addProblem = (parentId: string | null, listId: string, data: { name: string, priority: Problem['priority'], dueDate: string | null, notes: string }) => {
        const newProblem: Problem = {
            id: crypto.randomUUID(),
            name: data.name,
            notes: data.notes,
            dueDate: data.dueDate,
            priority: data.priority,
            status: 'to_solve',
            subproblems: [],
            completed: false
        };

        setState(prev => {
            const newLists = prev.lists.map(list => {
                if (list.id !== listId) return list;

                // Deep copy needed for immutability in React state (simple version)
                // For a prototype, structuredClone is good
                const updatedList = structuredClone(list);

                if (!parentId) {
                    updatedList.problems.push(newProblem);
                } else {
                    findProblemAndAdd(updatedList.problems, parentId, newProblem);
                }
                return updatedList;
            });
            return { lists: newLists };
        });
    };

    // Helper to recursively mark children
    const setCompletionRecursively = (problems: Problem[], completed: boolean) => {
        for (const p of problems) {
            p.completed = completed;
            p.status = completed ? 'solved' : 'to_solve';
            if (p.subproblems.length > 0) {
                setCompletionRecursively(p.subproblems, completed);
            }
        }
    };

    // Helper to find and update
    const findProblemAndUpdate = (problems: Problem[], problemId: string, updates: Partial<Problem>): boolean => {
        for (let i = 0; i < problems.length; i++) {
            if (problems[i].id === problemId) {
                // Apply updates
                const updatedProblem = { ...problems[i], ...updates };

                // Recursive Logic: If 'completed' field is present, apply to all children
                if (updates.completed !== undefined && updatedProblem.subproblems.length > 0) {
                    setCompletionRecursively(updatedProblem.subproblems, updates.completed);
                }

                problems[i] = updatedProblem;
                return true;
            }
            if (findProblemAndUpdate(problems[i].subproblems, problemId, updates)) {
                // Recursive Parent Status Update:
                // If the update set a status other than 'to_solve', ensure this parent is at least 'solving'.
                // Condition: Child is active (status != to_solve) AND Parent is inactive (status == to_solve).
                if (updates.status && updates.status !== 'to_solve') {
                    if (!problems[i].status || problems[i].status === 'to_solve') {
                        problems[i] = { ...problems[i], status: 'solving' };
                    }
                }
                return true;
            }
        }
        return false;
    };

    const updateProblem = (listId: string, problemId: string, updates: Partial<Problem>) => {
        setState(prev => {
            const newLists = prev.lists.map(list => {
                if (list.id !== listId) return list;
                const updatedList = structuredClone(list);
                findProblemAndUpdate(updatedList.problems, problemId, updates);
                return updatedList;
            });
            return { lists: newLists };
        });
    };

    const updateList = (listId: string, updates: Partial<List>) => {
        setState(prev => ({
            ...prev,
            lists: prev.lists.map(list =>
                list.id === listId ? { ...list, ...updates } : list
            )
        }));
    };

    const deleteList = (listId: string) => {
        setState(prev => ({
            ...prev,
            lists: prev.lists.filter(list => list.id !== listId)
        }));
    };

    const findProblemAndDelete = (problems: Problem[], problemId: string): boolean => {
        for (let i = 0; i < problems.length; i++) {
            if (problems[i].id === problemId) {
                problems.splice(i, 1);
                return true;
            }
            if (findProblemAndDelete(problems[i].subproblems, problemId)) return true;
        }
        return false;
    };

    const deleteProblem = (listId: string, problemId: string) => {
        setState(prev => {
            const newLists = prev.lists.map(list => {
                if (list.id !== listId) return list;
                const updatedList = structuredClone(list);
                findProblemAndDelete(updatedList.problems, problemId);
                return updatedList;
            });
            return { lists: newLists };
        });
    };

    const reorderLists = (newLists: List[]) => {
        setState(prev => ({
            ...prev,
            lists: newLists
        }));
    };

    const findProblemAndReorder = (problems: Problem[], parentId: string, newSubproblems: Problem[]): boolean => {
        for (let i = 0; i < problems.length; i++) {
            if (problems[i].id === parentId) {
                problems[i].subproblems = newSubproblems;
                return true;
            }
            if (findProblemAndReorder(problems[i].subproblems, parentId, newSubproblems)) return true;
        }
        return false;
    };

    const reorderProblems = (listId: string, parentProblemId: string | null, newProblems: Problem[]) => {
        setState(prev => {
            const newLists = prev.lists.map(list => {
                if (list.id !== listId) return list;
                const updatedList = structuredClone(list);

                if (!parentProblemId) {
                    updatedList.problems = newProblems;
                } else {
                    findProblemAndReorder(updatedList.problems, parentProblemId, newProblems);
                }
                return updatedList;
            });
            return { lists: newLists };
        });
    };

    const moveProblemToList = (problemId: string, fromListId: string, toListId: string) => {
        setState(prev => {
            const copy = JSON.parse(JSON.stringify(prev)); // Deep clone state

            const sourceList = copy.lists.find((l: List) => l.id === fromListId);
            if (!sourceList) return prev;

            // Helper to find and remove
            const removeProblem = (problems: Problem[], id: string): Problem | null => {
                for (let i = 0; i < problems.length; i++) {
                    if (problems[i].id === id) {
                        return problems.splice(i, 1)[0];
                    }
                    const found = removeProblem(problems[i].subproblems, id);
                    if (found) return found;
                }
                return null;
            };

            const problem = removeProblem(sourceList.problems, problemId);

            if (problem) {
                const targetList = copy.lists.find((l: List) => l.id === toListId);
                if (targetList) {
                    targetList.problems.push(problem);
                    return copy;
                }
            }
            return prev;
        });
    };

    // NEW: Reorder Today Problems
    const reorderTodayProblems = (items: { id: string, listId: string }[]) => {
        setState(prev => {
            const newState = structuredClone(prev);

            items.forEach((item, index) => {
                const list = newState.lists.find(l => l.id === item.listId);
                if (list) {
                    const findAndUpdate = (problems: Problem[]) => {
                        for (const p of problems) {
                            if (p.id === item.id) {
                                p.todayOrder = index;
                                return true;
                            }
                            if (findAndUpdate(p.subproblems)) return true;
                        }
                        return false;
                    };
                    findAndUpdate(list.problems);
                }
            });

            return newState;
        });
    };

    return (
        <StoreContext.Provider value={{
            state,
            addList,
            addProblem,
            updateProblem,
            updateList,
            deleteList,
            deleteProblem,
            reorderLists,
            reorderProblems,
            reorderTodayProblems,
            moveProblemToList
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within a StoreProvider');
    return context;
};
