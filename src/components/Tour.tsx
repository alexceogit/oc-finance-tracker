import { useState, useEffect, useRef } from 'react';
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
  const [isVisible, setIsVisible] = useState(true);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      // Restore focus
      previousActiveElement.current?.focus();
    };
  }, [currentStep, isVisible]);

  function updatePosition() {
    if (!isVisible) return;
    
    const targetElement = document.querySelector(`[data-tour="${tourSteps[currentStep].target}"]`);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const step = tourSteps[currentStep];
      
      let newPosition: { top: number; left: number; bottom?: number; right?: number };
      
      switch (step.position) {
        case 'bottom':
          newPosition = {
            top: rect.bottom + 10,
            left: Math.max(10, rect.left + (rect.width / 2) - 150)
          };
          break;
        case 'top':
          newPosition = {
            bottom: window.innerHeight - rect.top + 10,
            left: Math.max(10, rect.left + (rect.width / 2) - 150)
          };
          break;
        case 'left':
          newPosition = {
            top: Math.max(10, rect.top + (rect.height / 2) - 60),
            right: window.innerWidth - rect.left + 10
          };
          break;
        case 'right':
          newPosition = {
            top: Math.max(10, rect.top + (rect.height / 2) - 60),
            left: rect.right + 10
          };
          break;
        default:
          newPosition = {
            top: rect.bottom + 10,
            left: Math.max(10, rect.left + (rect.width / 2) - 150)
          };
      }
      
      setPosition(newPosition);
    }
  }

  async function handleNext() {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  }

  async function handleComplete() {
    setIsVisible(false);
    localStorage.setItem('tour_completed', 'true');
    // Small delay to ensure smooth transition
    setTimeout(() => {
      onComplete();
    }, 300);
  }

  function handleSkip() {
    handleComplete();
  }

  if (!isVisible) {
    return null;
  }

  const step = tourSteps[currentStep];
  const targetElement = document.querySelector(`[data-tour="${step.target}"]`);
  const hasTarget = !!targetElement;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" />
      
      {/* Highlight element */}
      {hasTarget && targetElement && (
        <div
          className="fixed z-40 border-2 border-indigo-500 rounded-lg animate-pulse"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Tour tooltip */}
      <div
        className="fixed z-50 w-[300px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl animate-slide-up"
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
            marginLeft: '-8px',
            top: step.position === 'bottom' ? '-8px' : 'auto',
            bottom: step.position === 'top' ? '-8px' : 'auto',
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
