"use client";
import React, { useState } from "react";
import BreadCrumbs from "../../shared/components/breadcrumbs";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../shared/utils/axiosInstance";

interface Admin {
    id: string;
    name: string;
    email: string;
    role: string;
}

const columns: ColumnDef<Admin>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Email", accessorKey: "email" },
    { header: "Role", accessorKey: "role" },
];

const Page = () => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedRole, setSelectedRole] = useState("user");

    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery<Admin[]>({
        queryKey: ["admins"],
        queryFn: async () => {
            const res = await axiosInstance.get("/admin/api/get-all-admin");
            return res.data.data || [];
        },
    });

    const { mutate: updateRole, isPending: updating } = useMutation<void, Error, void>({
        mutationFn: async () => {
            return await axiosInstance.put("/admin/api/add-new-admin", {
                email: search,
                role: selectedRole
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            setOpen(false);
            setSearch("");
            setSelectedRole("user");
        },
        onError: (err) => {
            console.error("Role update failed", err);
        },
    });


    const table = useReactTable({
        data: data || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id, // important!
    });

    const handleSubmit = (e: any) => {
        e.preventDefault();
        updateRole();
    };

    return (
        <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font tracking-wide">Team Management</h2>
                <button
                    onClick={() => setOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Add Admin
                </button>
            </div>

            <div className="mb-4">
                <BreadCrumbs title="Team Management" />
            </div>

            <div className="overflow-hidden rounded-md border border-gray-800 bg-gray-900 w-full">
                <table className="min-w-full text-left text-sm text-gray-200">
                    <thead className="bg-slate-800 text-slate-200">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="p-3">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="p-6 text-center text-slate-400">
                                    Loading ...
                                </td>
                            </tr>
                        ) : isError ? (
                            <tr>
                                <td colSpan={3} className="p-6 text-center text-red-500">
                                    Failed to load admins.
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-6 text-center text-slate-400">
                                    No admins found
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="border-t border-slate-700 hover:bg-slate-800 transition">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="p-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
                    <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md relative">
                        <button
                            className="absolute top-3 right-4 text-slate-400 hover:text-white"
                            onClick={() => setOpen(false)}
                        >
                            &times;
                        </button>

                        <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-slate-300">Email</label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="support@shoplet.com"
                                    className="w-full px-3 py-2 outline-none bg-slate-800 text-white rounded"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-slate-300">Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-600 rounded outline-none"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="w-full bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    disabled={updating}
                                >
                                    {updating ? "Updating..." : "Add Admin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    )
}

export default Page;
