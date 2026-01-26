import React from 'react';
import clsx from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    className,
    padding = 'md',
    hover = false,
    onClick,
}) => {
    const paddingStyles = {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    return (
        <div
            className={clsx(
                'bg-white rounded-lg shadow-md border border-gray-200',
                paddingStyles[padding],
                hover && 'hover:shadow-lg transition-shadow duration-200',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
