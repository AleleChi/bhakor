import React, { useState } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UpcomingTask, Severity } from '../types';

interface UpcomingTasksSectionProps {
  tasks: UpcomingTask[];
  onComplete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function UpcomingTasksSection({ tasks, onComplete, isLoading }: UpcomingTasksSectionProps) {
  const [markedId, setMarkedId] = useState<string | null>(null);

  const handleCompleteAction = async (id: string) => {
    setMarkedId(id);
    try {
      await onComplete(id);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkedId(null);
    }
  };

  const getPriorityBadge = (prio: Severity) => {
    switch (prio) {
      case 'critical':
        return 'text-rose-800 bg-rose-50 border-rose-100';
      case 'high':
        return 'text-amber-800 bg-amber-50 border-amber-100';
      case 'medium':
        return 'text-slate-700 bg-slate-50 border-slate-100';
      case 'low':
        return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col gap-4 animate-pulse">
        <div className="w-1/3 h-6 bg-slate-100 rounded-md" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col h-full text-slate-800 text-left">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4 select-none text-left font-sans">
        <div className="flex items-center gap-2 text-left">
          <ClipboardList className="w-5 h-5 text-[#64748B]" />
          <div className="text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">
              Upcoming Operational Obligations
            </h2>
            <p className="text-[10px] text-[#64748B] mt-0.5 font-medium">
              Action trackers and checklist obligations sorted by urgency
            </p>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-x-auto text-left">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider select-none">
              <th className="py-2.5 pl-2.5 font-semibold">Segment Task</th>
              <th className="py-2.5 text-center font-semibold">Priority</th>
              <th className="py-2.5 font-semibold">Due Date</th>
              <th className="py-2.5 font-semibold">Responsible</th>
              <th className="py-2.5 font-semibold">Status</th>
              <th className="py-2.5 text-right pr-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 text-xs font-medium">
                  All upcoming obligations completed successfully.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isMarking = markedId === task.id;

                return (
                  <tr 
                    id={`task-row-${task.id}`}
                    key={task.id} 
                    className={`ooms-table-row hover:bg-[rgba(245,158,11,0.06)] transition-all duration-150 ${
                      task.status === 'completed' ? 'opacity-50 line-through' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-2 text-xs max-w-xs truncate font-sans">
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="font-semibold text-slate-900">{task.task}</span>
                        <span className="text-[9px] font-mono font-bold uppercase text-[#64748B] tracking-wider">
                          {task.module} Ref
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`text-[9.5px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-md ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-[#64748B] font-mono font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-left">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.dueDate}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs text-slate-600 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap text-left font-sans">
                        <div className="w-5 h-5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-[9px] text-[#64748B] select-none font-mono">
                          {task.owner.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-700">{task.owner}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs font-sans">
                      {task.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-emerald-650 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Done</span>
                        </span>
                      ) : task.status === 'in-progress' ? (
                        <span className="flex items-center gap-1 text-amber-650 font-semibold animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      {task.status !== 'completed' && (
                        <button
                          id={`task-complete-${task.id}`}
                          aria-label={`Mark done upcoming obligation ${task.task}`}
                          disabled={isMarking}
                          onClick={() => handleCompleteAction(task.id)}
                          className="py-1 px-3 bg-slate-900 hover:bg-[#EA580C] text-white rounded-xl text-[10px] font-semibold font-mono uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 outline-hidden border border-transparent shadow-2xs"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isMarking ? 'Completing...' : 'Done'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
