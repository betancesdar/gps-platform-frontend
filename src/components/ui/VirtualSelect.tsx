'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
    id: string;
    label: string;
}

interface VirtualSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const VirtualSelect: React.FC<VirtualSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        const lowerSearch = search.toLowerCase();
        return options.filter(o => o.label.toLowerCase().includes(lowerSearch));
    }, [options, search]);

    const handleSelect = (id: string) => {
        onChange(id);
        setIsOpen(false);
        setSearch('');
    };

    const selectedOption = useMemo(() => options.find(o => o.id === value), [options, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const option = filteredOptions[index];
        const isSelected = option.id === value;

        return (
            <div
                style={style}
                className={`flex items-center px-3 cursor-pointer select-none
                    ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handleSelect(option.id)}
            >
                <div className="flex-1 truncate">{option.label}</div>
                {isSelected && <Check className="w-4 h-4 ml-2" />}
            </div>
        );
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm cursor-pointer text-gray-700'}
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 flex items-center bg-gray-50">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-transparent border-none outline-none text-sm text-gray-700"
                            autoFocus
                        />
                    </div>
                    {filteredOptions.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">No results found</div>
                    ) : (
                        <div className="max-h-[200px] overflow-y-auto w-full">
                            {filteredOptions.map((option, index) => (
                                <Row key={option.id} index={index} style={{}} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
