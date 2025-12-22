'use client';

import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { useTheme } from '../ThemeProvider';

interface AlertProps {
  type?: 'warning' | 'info' | 'error' | 'success' | 'tip';
  title?: string;
  children: React.ReactNode;
}

export function Alert({ type = 'info', title, children }: AlertProps) {
  const { theme } = useTheme();
  
  const config = {
      warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-400 dark:border-yellow-500',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-800 dark:text-yellow-300',
      textColor: 'text-yellow-700 dark:text-yellow-200',
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-400 dark:border-blue-500',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-800 dark:text-blue-300',
      textColor: 'text-blue-700 dark:text-blue-200',
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-400 dark:border-red-500',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-800 dark:text-red-300',
      textColor: 'text-red-700 dark:text-red-200',
    },
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-400 dark:border-green-500',
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-800 dark:text-green-300',
      textColor: 'text-green-700 dark:text-green-200',
    },
    tip: {
      icon: InformationCircleIcon,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-400 dark:border-purple-500',
      iconColor: 'text-purple-600 dark:text-purple-400',
      titleColor: 'text-purple-800 dark:text-purple-300',
      textColor: 'text-purple-700 dark:text-purple-200',
    },
  };

  const validType = (type && config[type as keyof typeof config]) ? type : 'info';
  const { icon: Icon, bgColor, borderColor, iconColor, titleColor, textColor } = config[validType];

      return (
        <div className={`my-4 sm:my-6 rounded-xl border-2 ${borderColor} ${bgColor} p-4 sm:p-5 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm`}>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`p-1.5 sm:p-2 rounded-lg bg-opacity-20 ${bgColor} border ${borderColor} flex-shrink-0`}>
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className={`font-bold text-base sm:text-lg mb-2 sm:mb-3 ${titleColor} transition-colors duration-200`}>{title}</h4>
              )}
              <div className={`text-sm sm:text-base ${textColor} leading-relaxed transition-colors duration-200`}>{children}</div>
            </div>
          </div>
        </div>
      );
}

