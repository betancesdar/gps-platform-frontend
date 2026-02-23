'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { devicesService } from '@/services/devices.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Smartphone,
    Wifi,
    QrCode,
    Copy,
    Check,
    AlertTriangle,
    Loader2,
    ArrowRight,
    ShieldAlert,
    Server
} from 'lucide-react';
import clsx from 'clsx';

interface EnrollDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EnrollDeviceModal: React.FC<EnrollDeviceModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'label' | 'code'>('label');
    const [label, setLabel] = useState('');
    const [hostIp, setHostIp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [enrollmentData, setEnrollmentData] = useState<{
        enrollmentCode: string;
        expiresAt: string;
        deviceId: string;
        qrPayload: string;
        normalizedServerBaseUrl: string;
    } | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [showCopied, setShowCopied] = useState(false);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setStep('label');
            setLabel('');
            setHostIp(window.location.hostname);
            setEnrollmentData(null);
            setShowCopied(false);
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
            const data = await devicesService.enrollDevice(label, hostIp);
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
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    const copyPayload = () => {
        if (enrollmentData) {
            copyToClipboard(enrollmentData.qrPayload);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
                                <button
                                    onClick={onClose}
                                    className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-900 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20 text-white transform rotate-3">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Enroll New Device</h3>
                                        <p className="text-sm text-gray-500 font-medium">Connect a GPS tracker to your fleet</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body - Scrollable */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {step === 'label' ? (
                                        <motion.form
                                            key="step-label"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            onSubmit={handleGenerate}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-4">
                                                <div className="group">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                                                        Device Label <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                                            <Smartphone className="w-5 h-5" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={label}
                                                            onChange={(e) => setLabel(e.target.value)}
                                                            placeholder="e.g. Delivery Truck 5"
                                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>

                                                <div className="group">
                                                    <div className="flex items-center justify-between mb-1.5 ml-1">
                                                        <label className="block text-sm font-semibold text-gray-700">
                                                            Server Host / IP <span className="text-red-500">*</span>
                                                        </label>
                                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wide">
                                                            Required
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                                            <Wifi className="w-5 h-5" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={hostIp}
                                                            onChange={(e) => setHostIp(e.target.value)}
                                                            placeholder="192.168.1.x"
                                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-mono text-sm"
                                                        />
                                                    </div>

                                                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                                        <div className="mt-0.5 p-1 bg-amber-100 rounded-full shrink-0">
                                                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                                                        </div>
                                                        <div className="text-xs text-amber-800 leading-relaxed">
                                                            <strong className="block mb-0.5 font-bold text-amber-900">Network Configuration</strong>
                                                            Use your computer's local IP (e.g., <code>192.168.1.50</code>) so the Android app can reach the server. Avoid using <code>localhost</code>.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100">
                                                <button
                                                    type="submit"
                                                    disabled={!label.trim() || !hostIp.trim() || isLoading}
                                                    className={clsx(
                                                        "w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide",
                                                        !label.trim() || !hostIp.trim() || isLoading
                                                            ? "bg-gray-300 cursor-not-allowed shadow-none"
                                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
                                                    )}
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Generate Enrollment Code
                                                            <ArrowRight className="w-5 h-5" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        <motion.div
                                            key="step-code"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="flex flex-col items-center"
                                        >
                                            {enrollmentData && (
                                                <>
                                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-3 relative w-full flex justify-center">
                                                        <div className="absolute inset-0 bg-blue-50 rounded-2xl -z-10 transform rotate-1 scale-[1.02]"></div>
                                                        <div style={{ maxWidth: '200px', width: '100%' }}>
                                                            <QRCode
                                                                value={enrollmentData.qrPayload}
                                                                size={200}
                                                                level="M"
                                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Server URL badge */}
                                                    <div className="w-full mb-1 flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full">
                                                            <Server className="w-3 h-3 text-gray-400 shrink-0" />
                                                            <span className="truncate">{enrollmentData.normalizedServerBaseUrl}</span>
                                                        </div>
                                                    </div>

                                                    {/* Copy Payload button */}
                                                    <button
                                                        onClick={copyPayload}
                                                        className="mb-4 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 transition-colors"
                                                    >
                                                        {showCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        {showCopied ? 'Copied!' : 'Copy QR Payload JSON'}
                                                    </button>

                                                    <div className="w-full space-y-5">
                                                        <div className="text-center">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                                                Manual Entry Code
                                                            </h4>
                                                            <button
                                                                onClick={() => copyToClipboard(enrollmentData.enrollmentCode)}
                                                                className="relative w-full group overflow-hidden rounded-xl"
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                                <div className="relative flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 group-hover:border-blue-300 rounded-xl transition-colors">
                                                                    <code className="text-3xl sm:text-4xl font-mono font-bold text-gray-800 tracking-widest">
                                                                        {enrollmentData.enrollmentCode}
                                                                    </code>
                                                                    {showCopied ? (
                                                                        <div className="p-1.5 bg-green-100 rounded-full animate-in zoom-in spin-in-90 duration-300">
                                                                            <Check className="w-5 h-5 text-green-600" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-1.5 bg-gray-100 group-hover:bg-blue-100 rounded-full transition-colors">
                                                                            <Copy className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                            <p className="text-xs text-gray-400 mt-2 font-medium">
                                                                Tap to copy to clipboard
                                                            </p>
                                                        </div>

                                                        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2.5 h-2.5 rounded-full ${timeLeft === 'Expired' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`}></div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Expires In</p>
                                                                    <p className={`text-sm font-bold font-mono ${timeLeft === 'Expired' ? 'text-red-600' : 'text-orange-600'}`}>
                                                                        {timeLeft}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Device ID</p>
                                                                <p className="text-xs font-mono text-gray-600 font-medium truncate max-w-[100px]">
                                                                    {enrollmentData.deviceId}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                                            <button
                                                                onClick={() => {
                                                                    setStep('label');
                                                                    setEnrollmentData(null);
                                                                }}
                                                                className="py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-sm"
                                                            >
                                                                New Device
                                                            </button>
                                                            <button
                                                                onClick={onClose}
                                                                className="py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl text-sm"
                                                            >
                                                                Finish
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
};
