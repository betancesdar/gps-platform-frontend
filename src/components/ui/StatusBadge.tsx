import React from 'react';
import clsx from 'clsx';

type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'EXECUTING';
type ExecutionStatus = 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED';
type StatusType = DeviceStatus | ExecutionStatus | 'idle' | string;

interface StatusBadgeProps {
    status?: StatusType;
    size?: 'sm' | 'md' | 'lg';
    showDot?: boolean;
}

const defaultConfig = {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    dotColor: 'bg-gray-400',
    label: 'Desconocido',
    animate: false,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    size = 'md',
    showDot = true,
}) => {
    const statusConfig: Record<string, typeof defaultConfig> = {
        // Device statuses (backend real)
        ONLINE: {
            color: 'bg-green-100 text-green-800 border-green-200',
            dotColor: 'bg-green-500',
            label: 'Online',
            animate: true,
        },
        OFFLINE: {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            dotColor: 'bg-gray-500',
            label: 'Offline',
            animate: false,
        },
        EXECUTING: {
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            dotColor: 'bg-blue-500',
            label: 'Ejecutando',
            animate: true,
        },

        // Execution statuses (backend real)
        RUNNING: {
            color: 'bg-green-100 text-green-800 border-green-200',
            dotColor: 'bg-green-500',
            label: 'En curso',
            animate: true,
        },
        PAUSED: {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            dotColor: 'bg-yellow-500',
            label: 'Pausado',
            animate: false,
        },
        STOPPED: {
            color: 'bg-red-100 text-red-800 border-red-200',
            dotColor: 'bg-red-500',
            label: 'Detenido',
            animate: false,
        },
        WAIT: {
            color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            dotColor: 'bg-indigo-500',
            label: 'Esperando',
            animate: true,
        },
        COMPLETED: {
            color: 'bg-purple-100 text-purple-800 border-purple-200',
            dotColor: 'bg-purple-500',
            label: 'Completado',
            animate: false,
        },

        // Legacy/idle
        idle: {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            dotColor: 'bg-gray-400',
            label: 'Inactivo',
            animate: false,
        },
    };

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const dotSizeClasses = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
    };

    // Use status config or default if status is undefined/unknown
    const config = status && statusConfig[status] ? statusConfig[status] : defaultConfig;

    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1.5 font-medium rounded-full border',
                config.color,
                sizeClasses[size]
            )}
        >
            {showDot && (
                <span className={clsx('rounded-full', dotSizeClasses[size], config.dotColor)}>
                    {config.animate && (
                        <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: config.dotColor }}></span>
                    )}
                </span>
            )}
            {config.label}
        </span>
    );
};
