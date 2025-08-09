import React, { useState, useEffect } from 'react';

const RightSidebar: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [calendarDate] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();
    const today = new Date().getDate();
    const isCurrentMonth = calendarDate.getMonth() === new Date().getMonth() && calendarDate.getFullYear() === new Date().getFullYear();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const renderCalendar = () => {
        const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <td key={`blank-${i}`} className="p-1"></td>);
        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isToday = isCurrentMonth && day === today;
            return (
                <td key={day} className="p-1">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
                        isToday ? 'bg-primary text-white font-bold' : 'text-text-primary hover:bg-secondary'
                    }`}>
                        {day}
                    </div>
                </td>
            );
        });

        const allCells = [...blanks, ...days];
        const rows: JSX.Element[][] = [];
        let cells: JSX.Element[] = [];

        allCells.forEach((cell, i) => {
            if (i > 0 && i % 7 === 0) {
                rows.push([...cells]);
                cells = [];
            }
            cells.push(cell);
        });
        if (cells.length > 0) {
            rows.push([...cells]);
        }
        
        return rows.map((row, i) => <tr key={i}>{row}</tr>);
    };

    return (
        <div className="space-y-8">
            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
                    <button className="text-text-secondary text-sm hover:text-text-primary transition-colors">Settings</button>
                </div>
                <div className="text-center text-text-secondary py-4 border-t border-b border-secondary">No new notifications</div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <div className="mb-4">
                    <p className="font-semibold text-text-primary">
                        {currentTime.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                     <p className="text-4xl font-bold text-accent">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                <div className="flex justify-between items-baseline mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">
                        {calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </h3>
                </div>
                <table className="w-full text-center">
                    <thead>
                        <tr>
                            {daysOfWeek.map(day => (
                                <th key={day} className="text-xs text-text-secondary pb-2 font-normal">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderCalendar()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RightSidebar;