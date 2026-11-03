"use client";

import { ReactNode, CSSProperties, HTMLAttributes } from 'react';

interface BentoCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function BentoCard({ children, className = '', style = {}, ...props }: BentoCardProps) {
  return (
    <div
      className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow hover:-translate-y-1 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
