'use client'
import React, { useDeferredValue, useMemo, useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    flexRender,
    getSortedRowModel,
} from '@tanstack/react-table'
import {
    Search,
    Download,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../shared/utils/axiosInstance'
import { saveAs } from 'file-saver'
import BreadCrumbs from '../../shared/components/breadcrumbs'

const EventsPage = () => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [page, setPage] = useState(1)
    const deferredGlobalFilter = useDeferredValue(globalFilter);
    const limit = 10

    const { data, isLoading } = useQuery({
        queryKey: ['events-list', page],
        queryFn: async () => {
            const res = await axiosInstance.get(`/admin/api/get-all-events?limit=${limit}&page=${page}`)
            return res.data
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 5,
    });

    const allEvents = data?.data || [];
    const totalPages = Math.ceil((data?.meta?.totalEvents ?? 0) / limit);

    const filteredEvents = useMemo(() => {
        return allEvents.filter((event: any) => {

        });
    }, [allEvents, deferredGlobalFilter]);

    const columns = useMemo(() => [
        {
            accessorKey: 'image',
            header: 'Image',
            cell: ({ row }: any) => (
                <Image
                    src={row.original.images?.[0]?.url || '/placeholder.png'}
                    alt={row.original.title}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded object-cover"
                />
            ),
        },
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }: any) => (
                <Link href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
                    target='_blank'
                    className='hover:text-blue-500 hover:border-b'
                >
                    {row.original.title}
                </Link>
            )
        },

        {
            accessorKey: 'sale_price',
            header: 'Price',
            cell: ({ row }: any) => <span>${row.original.sale_price}</span>,
        },
        {
            accessorKey: 'stock',
            header: 'Stock',
        },
        {
            accessorKey: "starting_date",
            header: "Start",
            cell: ({ row }) => new Date(row.original.starting_date).toLocaleDateString()
        },
        {
            accessorKey: "ending_date",
            header: "End",
            cell: ({ row }) => new Date(row.original.ending_date).toLocaleDateString()
        },
        {
            accessorKey: 'shop.name',
            header: 'Shop Name',
            cell: ({ row }) => row.original.shop?.name || "-",
        },
    ], []);

    const table = useReactTable({
        data: filteredEvents,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
    });

    const exportToCSV = () => {
        const csvData = filteredEvents.map((event: any) =>
            `${event.title},${event.sale_price},${event.stock},${event.starting_date},${event.ending_date},${event.shop.name}`
        );
        const blob = new Blob([`Title,Price,Stock,Start Date, End Date, Shop\n${csvData.join('\n')}`], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `events-page-${page}.csv`);
    };

    return (
        <div className='w-full min-h-screen p-8 bg-black text-white text-sm'>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl text-white font-semibold">All Events</h2>
                <button
                    onClick={exportToCSV}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* Breadcrumb */}
            <div className=" mb-4">
                <BreadCrumbs title="All Events" />
            </div>

            {/* Search */}
            <div className="mb-4 flex items-center bg-gray-900 p-2 rounded flex-1">
                <Search size={18} className="text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full bg-transparent outline-none text-white"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-gray-900 p-4 rounded-lg">
                {isLoading ? (
                    <p className="text-center text-white">Loading events...</p>
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
        </div>
    )
};

export default EventsPage;