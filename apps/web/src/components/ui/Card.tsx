import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6',
        className,
      )}
      {...props}
    >
      {title ? (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
};
