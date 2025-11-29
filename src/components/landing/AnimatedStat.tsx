'use client';

import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface AnimatedStatProps {
  end: number;
  label: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function AnimatedStat({ 
  end, 
  label, 
  suffix = '', 
  prefix = '',
  duration = 2 
}: AnimatedStatProps) {
  const [ref, inView] = useInView({ 
    triggerOnce: true,
    threshold: 0.5 
  });

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
        {inView && (
          <CountUp
            end={end}
            duration={duration}
            separator=","
            prefix={prefix}
            suffix={suffix}
          />
        )}
      </div>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
