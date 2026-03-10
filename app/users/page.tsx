'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { usersService, User } from '@/services/users.service';
import { Shield, User as UserIcon, Activity, ArrowLeft, UserPlus, Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateUserModal } from '@/components/users/CreateUserModal';

export default function UsersPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const data = await usersService.getAllUsers();
            setUsers(data);
            setError(null);
        } catch (err: any) {
            setError('Error loading users. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (user?.role !== 'ADMIN') {
            router.push('/');
            return;
        }

        loadUsers();
    }, [isAuthenticated, user, router]);

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
            await usersService.toggleUserStatus(userId, !currentStatus);
        } catch (error) {
            console.error("Failed to toggle user status:", error);
            // Revert on failure
            setUsers(users.map(u => u.id === userId ? { ...u, isActive: currentStatus } : u));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading personnel data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/')}
                            className="p-2 bg-white text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </motion.button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                            <p className="text-slate-500 font-medium">Manage administrators and field collaborators</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>Add New Member</span>
                    </motion.button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-center">Devices</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.map((member) => (
                                    <motion.tr
                                        key={member.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${member.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {member.role === 'admin' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{member.username}</p>
                                                    <p className="text-xs text-slate-400">ID: {member.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${member.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {member.role.toUpperCase()}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-teal-500' : 'bg-red-500'}`}></div>
                                                <span className={`text-sm font-medium ${member.isActive ? 'text-teal-700' : 'text-red-700'}`}>
                                                    {member.isActive ? 'Active' : 'Deactivated'}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-semibold text-sm">
                                                <Activity className="w-4 h-4 mr-1 text-slate-400" />
                                                {member._count?.devices || 0}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleToggleStatus(member.id, member.isActive)}
                                                disabled={member.username === 'admin'}
                                                className={`p-2 rounded-lg transition-colors ${member.username === 'admin'
                                                        ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400'
                                                        : member.isActive
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                                                    }`}
                                                title={member.isActive ? "Deactivate Account" : "Activate Account"}
                                            >
                                                <Power className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    loadUsers();
                }}
            />
        </div>
    );
}
