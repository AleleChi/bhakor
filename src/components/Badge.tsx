import React from 'react';

export type BadgeVariant = 'Approved' | 'Pending' | 'Rejected' | 'Info' | 'active' | 'inactive' | 'success' | 'warn' | 'error';

interface BadgeProps {
  id?: string;
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ id, variant, children, className = '' }: BadgeProps) {
  let styles = 'bg-slate-105 text-slate-705 border-slate-205';

  switch (variant) {
    case 'Approved':
    case 'success':
    case 'active':
      styles = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      break;
    case 'Pending':
    case 'warn':
      styles = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case 'Rejected':
    case 'error':
    case 'inactive':
      styles = 'bg-rose-100 text-rose-800 border-rose-200';
      break;
    case 'Info':
    default:
      styles = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
  }

  return (
    <span 
      id={id}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
