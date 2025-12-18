import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Link, useLocation } from 'react-router-dom';
import { Inbox, Calendar, Target, CalendarRange, Settings, CheckCircle2, RotateCcw, Plus, Zap, CalendarClock } from 'lucide-react'; // Using Target for Unfinished/Focus
import type { Problem } from '../types';
import CreateListModal from './CreateListModal';
import CreateProblemModal from './CreateProblemModal';

export default function Sidebar() {
    const { state, addList, reorderLists } = useStore();
    const location = useLocation();
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [isCreatingProblem, setIsCreatingProblem] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // --- Logic from App.tsx (Counts) ---
    // Duplicate logic for now. Ideally should be in a hook or helper.
    const countProblems = (problems: Problem[]): number => {
        let count = 0;
        for (const p of problems) {
            if (!p.completed) count += 1;
            count += countProblems(p.subproblems);
        }
        return count;
    };
    const countTodayProblems = (problems: Problem[]): number => {
        let count = 0;
        for (const p of problems) {
            if (!p.completed && p.priority === 'today') count += 1;
            count += countTodayProblems(p.subproblems);
        }
        return count;
    };
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
    const countWeekProblems = (problems: Problem[]): number => {
        let count = 0;
        for (const p of problems) {
            if (!p.completed) {
                const isPriorityMatch = p.priority === 'today' || p.priority === 'this_week';
                const isDueMatch = isDateInCurrentWeek(p.dueDate);
                if (isPriorityMatch || isDueMatch) count += 1;
            }
            count += countWeekProblems(p.subproblems);
        }
        return count;
    };
    const countUpcomingProblems = (problems: Problem[]): number => {
        let count = 0;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayStr = now.toLocaleDateString('en-CA');

        for (const p of problems) {
            if (!p.completed && p.dueDate) {
                if (p.dueDate > todayStr) {
                    count += 1;
                }
            }
            count += countUpcomingProblems(p.subproblems);
        }
        return count;
    };

    const countUnfinishedProblems = (problems: Problem[]): number => {
        let count = 0;
        for (const p of problems) {
            if (!p.completed && (p.status === 'solving' || p.status === 'blocked')) count += 1;
            count += countUnfinishedProblems(p.subproblems);
        }
        return count;
    };
    const countNextActionsProblems = (problems: Problem[]): number => {
        let count = 0;
        for (const p of problems) {
            if (!p.completed) {
                const incompleteChildren = p.subproblems.filter(sub => !sub.completed);
                if (incompleteChildren.length === 0) {
                    count += 1;
                }
            }
            count += countNextActionsProblems(p.subproblems);
        }
        return count;
    };

    const totalProblems = state.lists.reduce((acc, list) => acc + countProblems(list.problems), 0);
    const todayProblemsCount = state.lists.reduce((acc, list) => acc + countTodayProblems(list.problems), 0);
    const unfinishedProblemsCount = state.lists.reduce((acc, list) => acc + countUnfinishedProblems(list.problems), 0);
    const weekProblemsCount = state.lists.reduce((acc, list) => acc + countWeekProblems(list.problems), 0);
    const nextActionsCount = state.lists.reduce((acc, list) => acc + countNextActionsProblems(list.problems), 0);
    const upcomingProblemsCount = state.lists.reduce((acc, list) => acc + countUpcomingProblems(list.problems), 0);

    const inboxList = state.lists.find(l => l.id === 'inbox');
    const inboxCount = inboxList ? countProblems(inboxList.problems) : 0;

    const isInboxActive = location.pathname.includes('/list/inbox');
    const isTodayActive = location.pathname === '/today';
    const isWeekActive = location.pathname === '/week';
    const isUpcomingActive = location.pathname === '/upcoming';
    const isUnfinishedActive = location.pathname === '/unfinished';
    const isNextActionsActive = location.pathname === '/next-actions';
    const isSettingsActive = location.pathname === '/settings';

    // --- Logic from HomePage.tsx (Lists) ---
    const visibleLists = state.lists.filter(l => l.id !== 'inbox');

    const handleCreate = (name: string, emoji?: string, description?: string) => {
        addList(name, emoji, description);
        setIsCreatingList(false);
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
        const newFullLists = inboxList ? [inboxList, ...newVisibleLists] : newVisibleLists;
        reorderLists(newFullLists);
        setDraggedIndex(targetIndex);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const NavItem = ({ to, label, icon: Icon, emoji, count, isActive }: any) => (
        <Link
            to={to}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.5rem',
                borderRadius: '6px',
                color: isActive ? '#111' : '#666',
                backgroundColor: isActive ? '#f0f0f0' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                marginBottom: '0.25rem'
            }}
            onMouseEnter={e => !isActive && (e.currentTarget.style.backgroundColor = '#f9f9f9')}
            onMouseLeave={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {emoji ? (
                    <span style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>{emoji}</span>
                ) : (
                    Icon && <Icon size={16} />
                )}
                <span>{label}</span>
            </div>
            {count > 0 && <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: isActive ? 600 : 400 }}>{count}</span>}
        </Link>
    );

    return (
        <div style={{
            width: '280px',
            height: '100vh',
            position: 'sticky',
            top: 0,
            borderRight: '1px solid #f0f0f0',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem'
        }}>
            {/* Header: Total Count + New Problem Button */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1.2rem', textDecoration: 'none', color: '#111' }}>
                    {/* Only showing count text as per screenshot "37 problems" */}
                    {totalProblems} problems
                </Link>

                <button
                    onClick={() => setIsCreatingProblem(true)}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#f0f0f0',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#666',
                        transition: 'background-color 0.2s, color 0.2s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.color = '#666';
                    }}
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Nav Links */}
            <div style={{ marginBottom: '2rem' }}>
                <NavItem
                    to="/list/inbox"
                    label="Inbox"
                    icon={Inbox}
                    count={inboxCount}
                    isActive={isInboxActive}
                />

                <NavItem to="/today" label="Today" icon={Calendar} count={todayProblemsCount} isActive={isTodayActive} />
                <NavItem to="/week" label="This Week" icon={CalendarRange} count={weekProblemsCount} isActive={isWeekActive} />
                <NavItem to="/upcoming" label="Upcoming" icon={CalendarClock} count={upcomingProblemsCount} isActive={isUpcomingActive} />
                <div style={{ display: 'none' }}>
                    <NavItem to="/unfinished" label="Unfinished" icon={Target} count={unfinishedProblemsCount} isActive={isUnfinishedActive} />
                    <NavItem to="/next-actions" label="Next Actions" icon={Zap} count={nextActionsCount} isActive={isNextActionsActive} />
                </div>
            </div>

            {/* Lists Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                    Lists
                </div>
                <button
                    onClick={() => setIsCreatingList(true)}
                    style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#aaa',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s, color 0.2s',
                        padding: 0
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.color = '#666';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#aaa';
                    }}
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Lists */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {visibleLists.map((list, index) => {
                    const count = countProblems(list.problems);
                    const isActive = location.pathname.includes(`/ list / ${list.id} `);

                    return (
                        <div
                            key={list.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            style={{ opacity: draggedIndex === index ? 0.5 : 1 }}
                        >
                            <NavItem
                                to={`/ list / ${list.id} `}
                                label={list.name}
                                icon={CheckCircle2}
                                emoji={list.emoji}
                                count={count}
                                isActive={isActive}
                            />
                        </div>
                    );
                })}

                {/* Modals */}
                <CreateListModal
                    isOpen={isCreatingList}
                    onClose={() => setIsCreatingList(false)}
                    onCreate={handleCreate}
                />

                <CreateProblemModal
                    isOpen={isCreatingProblem}
                    onClose={() => setIsCreatingProblem(false)}
                    defaultListId="inbox"
                    showListSelector={true}
                    parentId={null}
                />
            </div>

            {/* Footer Settings */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1rem', marginTop: '1rem' }}>
                <Link
                    to="/settings"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: isSettingsActive ? '#111' : '#aaa',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    <Settings size={16} />
                    Settings
                </Link>
            </div>
        </div>
    );
}
