"use client";
import BreadCrumbs from "../../shared/components/breadcrumbs";
import React, { useMemo, useState, useDeferredValue, use } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender, getSortedRowModel } from "@tanstack/react-table";
import { Search, Download, Ban } from "lucide-react";
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryResult
} from "@tanstack/react-query";
import axiosInstance from "../../shared/utils/axiosInstance";
import { saveAs } from "file-saver";



// Types
type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
};

type UsersResponse = {
    data: User[];
    meta: {
        totalUsers: number;
    }
}

const UsersPage = () => {
    const [globalFilter, setGlobalFilter] = useState("");
    const [page, setPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const deferredGlobalFilter = useDeferredValue(globalFilter);
    const limit = 10;
    const queryClient = useQueryClient();

    const { data, isLoading }: UseQueryResult<UsersResponse, Error> = useQuery<
        UsersResponse,
        Error,
        UsersResponse,
        [string, number]
    >({
        queryKey: ["users-list", page],
        queryFn: async () => {
            const res = await axiosInstance.get(`/admin/api/get-all-users?page=${page}&limit=${limit}`);
            return res.data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 5,
    });

    const banUserMutation = useMutation({
        mutationFn: async (userId: any) => {
            await axiosInstance.put(`/admin/api/ban-user/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users-list"] });
            setIsModalOpen(false);
            setSelectedUser(null);
        },
    });

    const allUsers = data?.data || [];
    const filteredUsers = useMemo(() => {
        return allUsers.filter((user) => {
            const matchesRole = roleFilter ? user.role.toLowerCase() === roleFilter.toLowerCase() : true;
            const matchesGlobal = deferredGlobalFilter ? Object.values(user).join(" ").toLowerCase().includes(deferredGlobalFilter.toLowerCase()) : true;
            return matchesRole && matchesGlobal;
        });
    }, [allUsers, roleFilter, deferredGlobalFilter]);

    const totalPages = Math.ceil((data?.meta?.totalUsers ?? 0) / limit);

    const columns = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Name",
            },
            {
                accessorKey: "email",
                header: "Email",
            },
            {
                accessorKey: "role",
                header: "Role",
                cell: ({ row }: any) => (
                    <span className="uppercase font-semibold text-blue-400">{row.original.role}</span>
                )
            },
            {
                accessorKey: "createdAt",
                header: "Joined",
                cell: ({ row }: any) => (
                    <span className="text-gray-400">
                        {new Date(row.original.createdAt).toLocaleString()}
                    </span>
                )
            },
            {
                header: "Actions",
                cell: ({ row }: any) => (
                    <button
                        onClick={() => {
                            setSelectedUser(row.original); // ✅ store user info
                            setIsModalOpen(true);          // ✅ open modal
                        }}
                        className="text-red-400 hover:text-red-300 transition"
                    >
                        <Ban size={20} />
                    </button>
                ),
            }
        ], []
    );

    const table = useReactTable({
        data: filteredUsers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
    });

    const exportToCSV = () => {
        const csvData = filteredUsers.map((user) =>
            `${user.name},${user.email},${user.role},${user.createdAt}`
        );
        const blob = new Blob([`Name,Email,Role,Created At\n${csvData.join('\n')}`], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `events-page-${page}.csv`);
    };

    return (
        <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl text-white font-semibold">All Users</h2>
                <button
                    onClick={exportToCSV}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center gap-2"
                >
                    <Download size={18} /> Export CSV
                </button>
                <select className="bg-gray-800 border border-gray-700 outline-none text-white"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
            </div>

            {/* Breadcrumbs */}
            <div className="mb-4">
                <BreadCrumbs title="All Users" />
            </div>

            {/* Search Bar */}
            <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
                <Search size={18} className="text-gray-400 mr-2" />
                <input type="text" placeholder="Search user..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full bg-transparent text-white outline-none" />
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-gray-900 p-4 rounded-lg">
                {isLoading ? (
                    <p className="text-center text-white">Loading users...</p>
                ) : (
                    <table className="w-full text-white text-sm">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-gray-800">
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="p-3 text-left ">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-gray-800 hover:bg-gray-800 transition"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="p-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        className={`px-4 py-1 rounded ${page === 1
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'
                            }`}
                    >
                        Previous
                    </button>

                    <span className="text-gray-400 text-sm">
                        Page {page} of {totalPages || 1}
                    </span>

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        className={`px-4 py-1 rounded ${page === totalPages
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Ban Confirmation Modal */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    <div className="bg-[#1e293b] rounded-2xl shadow-lg w-[90%] max-w-md p-6 relative">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-white text-lg font-semibold">Ban User</h3>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-300 leading-6">
                                <span className="text-yellow-400 font-semibold">
                                    Important: {" "}
                                </span>
                                Are you sure you want to ban{" "}
                                <span className="text-red-400 font-medium">
                                    {selectedUser.name}
                                </span>
                                ? This action can be reverted later
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm text-white">
                                Cancel
                            </button>
                            <button
                                onClick={() => banUserMutation.mutate(selectedUser.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-sm text-white">
                                <Ban size={16} /> Confirm Ban
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )

}

export default UsersPage