'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '../ui/Button';
import { devicesService } from '@/services/devices.service';

interface EnrollDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EnrollDeviceModal: React.FC<EnrollDeviceModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'label' | 'code'>('label');
    const [label, setLabel] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [enrollmentData, setEnrollmentData] = useState<{
        enrollmentCode: string;
        expiresAt: string;
        deviceId: string;
        qrPayload: string;
    } | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setStep('label');
            setLabel('');
            setEnrollmentData(null);
        }
    }, [isOpen]);

    // Timer logic
    useEffect(() => {
        if (!enrollmentData) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const exp = new Date(enrollmentData.expiresAt).getTime();
            const diff = exp - now;

            if (diff <= 0) {
                setTimeLeft('Expired');
                clearInterval(timer);
            } else {
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [enrollmentData]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!label.trim()) return;

        setIsLoading(true);
        try {
            const data = await devicesService.enrollDevice(label);
            setEnrollmentData(data);
            setStep('code');
        } catch (error: any) {
            console.error('Enrollment failed:', error);
            alert('Failed to generate enrollment code');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Enroll New Device</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                </div>

                <div className="p-6">
                    {step === 'label' ? (
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device Label</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="e.g. Test Phone 1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Determines the persistent name for this device.
                                </p>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" isLoading={isLoading} disabled={!label.trim()} variant="primary">
                                    Generate Code
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center space-y-6">
                            {enrollmentData && (
                                <>
                                    <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100">
                                        <QRCode
                                            value={enrollmentData.qrPayload}
                                            size={200}
                                            level="M"
                                        />
                                    </div>

                                    <div className="text-center w-full">
                                        <p className="text-sm text-gray-500 mb-2 font-medium">Scan with Mobile App</p>
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <code className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                                                {enrollmentData.enrollmentCode}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(enrollmentData.enrollmentCode)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50 transition-colors"
                                                title="Copy Code"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </button>
                                        </div>
                                        <div className={`text-xs font-bold ${timeLeft === 'Expired' ? 'text-red-500' : 'text-orange-500'}`}>
                                            Expires in: {timeLeft}
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-500 break-all font-mono">
                                        <span className="font-bold block mb-1">Device ID:</span>
                                        {enrollmentData.deviceId}
                                    </div>

                                    <Button onClick={onClose} variant="secondary" className="w-full">
                                        Done
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
