import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface TourStep {
  target: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TourProps {
  onComplete: () => void;
}

const tourSteps: TourStep[] = [
  {
    target: 'net-balance',
    content: 'tour.netBalance',
    position: 'bottom'
  },
  {
    target: 'income-button',
    content: 'tour.addIncome',
    position: 'top'
  },
  {
    target: 'expense-button',
    content: 'tour.addExpense',
    position: 'top'
  },
  {
    target: 'debts-section',
    content: 'tour.debts',
    position: 'bottom'
  },
  {
    target: 'goals-section',
    content: 'tour.goals',
    position: 'bottom'
  }
];

export default function Tour({ onComplete }: TourProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; bottom?: number; right?: number } | null>(null);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep]);

  function updatePosition() {
    const targetElement = document.querySelector(`[data-tour="${tourSteps[currentStep].target}"]`);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const step = tourSteps[currentStep];
      
      let newPosition: { top: number; left: number; bottom?: number; right?: number };
      
      switch (step.position) {
        case 'bottom':
          newPosition = {
            top: rect.bottom + 10 + window.scrollY,
            left: rect.left + (rect.width / 2) - 150
          };
          break;
        case 'top':
          newPosition = {
            bottom: window.innerHeight - rect.top + 10 + window.scrollY,
            left: rect.left + (rect.width / 2) - 150
          };
          break;
        case 'left':
          newPosition = {
            top: rect.top + window.scrollY + (rect.height / 2) - 60,
            right: window.innerWidth - rect.left + 10
          };
          break;
        case 'right':
          newPosition = {
            top: rect.top + window.scrollY + (rect.height / 2) - 60,
            left: rect.right + 10
          };
          break;
        default:
          newPosition = {
            top: rect.bottom + 10 + window.scrollY,
            left: rect.left + (rect.width / 2) - 150
          };
      }
      
      setPosition(newPosition);
    }
  }

  function handleNext() {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }

  function handleComplete() {
    localStorage.setItem('tour_completed', 'true');
    onComplete();
  }

  function handleSkip() {
    handleComplete();
  }

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Highlight element */}
      {(() => {
        const targetElement = document.querySelector(`[data-tour="${step.target}"]`);
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          return (
            <div
              className="fixed z-40 border-2 border-indigo-500 rounded-lg animate-pulse"
              style={{
                top: rect.top - 4 + window.scrollY,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
              }}
            />
          );
        }
        return null;
      })()}

      {/* Tour tooltip */}
      <div
        className="fixed z-50 w-[300px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl animate-fade-in"
        style={position || { top: 100, left: 50 }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {currentStep + 1}/{tourSteps.length}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('tour.stepOf', { current: currentStep + 1, total: tourSteps.length })}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-900 dark:text-white font-medium mb-4">
            {t(step.content)}
          </p>
          
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t('tour.skip')}
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              {currentStep < tourSteps.length - 1 ? t('tour.next') : t('tour.done')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Arrow */}
        <div 
          className="absolute w-4 h-4 bg-white dark:bg-slate-800 rotate-45"
          style={{
            left: '50%',
            transform: step.position === 'bottom' ? 'translateX(-50%) rotate(45deg) translateY(-50%)' : 'translateX(-50%) rotate(-135deg) translateY(-50%)',
            top: step.position === 'bottom' ? -2 : 'auto',
            bottom: step.position === 'top' ? -2 : 'auto',
          }}
        />
      </div>
    </>
  );
}

export function shouldShowTour(): boolean {
  return localStorage.getItem('tour_completed') !== 'true';
}

export function resetTour() {
  localStorage.removeItem('tour_completed');
}
