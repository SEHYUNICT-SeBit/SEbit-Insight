'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2',
            i < currentStep
              ? 'text-primary'
              : i === currentStep
                ? 'text-foreground'
                : 'text-muted-foreground'
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              i === currentStep
                ? 'bg-primary text-white'
                : i < currentStep
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <span className="text-sm hidden sm:inline">{step.label}</span>
          {i < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}
