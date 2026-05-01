'use client';

import { motion } from 'framer-motion';
import { Target, Image as ImageIcon, Calendar, Wallet as WalletIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Goal } from '@/types';
import Image from 'next/image';

interface GoalGridProps {
  goals: Goal[];
  columns?: 'auto' | 1;
}

export default function GoalGrid({ goals, columns = 'auto' }: GoalGridProps) {
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--cyber-surface-alt)] flex items-center justify-center mb-4">
          <Target size={28} className="text-[var(--cyber-cyan)]" />
        </div>
        <p className="text-base text-[var(--cyber-text)] font-bold">No Saving Goals</p>
        <p className="text-sm text-[var(--cyber-text-muted)] mt-1">
          Set up a target to start saving towards what you want.
        </p>
      </div>
    );
  }

  // Calculate days left
  const getDaysLeft = (targetDate: string | null) => {
    if (!targetDate) return null;
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const gridClass = columns === 1 
    ? 'grid grid-cols-1 gap-5' 
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';

  return (
    <div className={gridClass}>
      {goals.map((goal, i) => {
        const balance = goal.wallet?.balance || 0;
        const target = goal.target_amount;
        const rawProgress = (balance / target) * 100;
        const progress = Math.min(Math.max(rawProgress, 0), 100);
        const daysLeft = getDaysLeft(goal.target_date);
        
        return (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] hover:border-[var(--cyber-cyan)]/40 transition-colors"
          >
            {/* Image Section */}
            <div className="h-40 w-full relative bg-[var(--cyber-surface-alt)] border-b border-[var(--cyber-border)]">
              {goal.image_url ? (
                <Image
                  src={goal.image_url}
                  alt={goal.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon size={32} className="text-[var(--cyber-border)]" />
                </div>
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--cyber-surface)] to-transparent" />
            </div>

            {/* Info Section */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-[var(--cyber-text)] line-clamp-1">{goal.name}</h3>
                {daysLeft !== null && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--cyber-surface-alt)] rounded-md border border-[var(--cyber-border)] shrink-0">
                    <Calendar size={12} className="text-[var(--cyber-text-muted)]" />
                    <span className="text-[10px] font-mono font-medium text-[var(--cyber-text-secondary)]">
                      {daysLeft}d left
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Tracker */}
              <div className="mt-auto space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-wider mb-0.5">Saved</p>
                    <p className="text-base font-bold font-mono text-[var(--cyber-cyan)]">
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-wider mb-0.5">Target</p>
                    <p className="text-sm font-bold font-mono text-[var(--cyber-text-secondary)]">
                      {formatCurrency(target)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="h-2 w-full bg-[var(--cyber-surface-alt)] rounded-full overflow-hidden border border-[var(--cyber-border)]">
                  <motion.div
                    className="h-full bg-[var(--cyber-cyan)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                      boxShadow: progress > 0 ? '0 0 10px var(--cyber-cyan)' : 'none'
                    }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-mono text-[var(--cyber-text-muted)]">
                  <span>{progress.toFixed(1)}%</span>
                  <span className="flex items-center gap-1">
                    <WalletIcon size={10} />
                    Auto-synced
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
