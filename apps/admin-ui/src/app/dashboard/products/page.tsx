'use client'
import React, { useMemo, useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table'
import {
    Search,
    Eye,
    ChevronRight,
    Download,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../shared/utils/axiosInstance'

const fetchAdminProducts = async (page: number, limit: number) => {
    const res = await axiosInstance.get(`/admin/api/get-all-products?page=${page}&limit=${limit}`)
    return res.data
}

const AdminProductList = () => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [page, setPage] = useState(1)
    const limit = 10

    const { data, isLoading } = useQuery({
        queryKey: ['admin-products', page],
        queryFn: () => fetchAdminProducts(page, limit),
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 5,
    })

    const products = data?.data || []
    const totalPages = Math.ceil((data?.meta?.totalProduct ?? 0) / limit)

    const columns = useMemo(
        () => [
            {
                accessorKey: 'image',
                header: 'Image',
                cell: ({ row }: any) => (
                    <Image
                        src={row.original.images?.[0]?.url || '/placeholder.png'}
                        alt={row.original.title}
                        width={48}
                        height={48}
                        className="rounded-md object-cover"
                    />
                ),
            },
           {
                accessorKey: "title",
                header: "Title",
                cell: ({ row }: any) => (
                    <Link href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
                        target='_blank'
                        className='text-blue-400 hover:underline'
                    >
                        {row.original.title}
                    </Link>
                )
            },

            {
                accessorKey: 'regular_price',
                header: 'Price',
                cell: ({ row }: any) => <span>${row.original.regular_price}</span>,
            },
            {
                accessorKey: 'stock',
                header: 'Stock',
                cell: ({ row }: any) => (
                    <span>{row.original.stock} left</span>
                ),
            },
            {
                accessorKey: 'category',
                header: 'Category',
            },
            {
                accessorKey: 'rating',
                header: 'Rating',
                cell: ({ row }: any) => <span>{row.original.rating || 5}</span>,
            },
            {
                accessorKey: 'shop',
                header: 'Shop',
                cell: ({ row }: any) => (
                    <Link
                        href={`/admin/shops/${row.original.shop?._id}`}
                        className="text-purple-400 hover:underline"
                    >
                        {row.original.shop?.name || 'N/A'}
                    </Link>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Created',
                cell: ({ row }: any) => {
                    const date = new Date(row.original.createdAt)
                    return <span>{date.toLocaleDateString()}</span>
                },
            },
           {
                header: "Actions",
                cell: ({ row }: any) => (
                    <Link href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`} className='text-blue-400 hover:underline'>
                        <Eye size={16} />
                    </Link>
                )
            }

        ],
        []
    )

    const table = useReactTable({
        data: products,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: 'includesString',
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
    })

    const handleExportCSV = () => {
        const headers = ['Title', 'Price', 'Stock', 'Category', 'Rating', 'Shop', 'Created']
        const rows = products.map((p: any) => [
            p.title,
            `$${p.regular_price}`,
            p.stock,
            p.category,
            p.rating,
            p.shop?.name || 'N/A',
            new Date(p.createdAt).toLocaleDateString(),
        ])

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')

        const link = document.createElement('a')
        link.setAttribute('href', encodeURI(csvContent))
        link.setAttribute('download', 'admin_products.csv')
        link.click()
    }

    return (
        <div className="w-full min-h-screen p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl text-white font-semibold">All Products</h2>
                <button
                    onClick={handleExportCSV}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center mb-4">
                <Link href="/admin/dashboard" className="text-blue-400 cursor-pointer">
                    Dashboard
                </Link>
                <ChevronRight size={20} className="text-gray-200" />
                <span className="text-white">All Products</span>
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
                    <p className="text-center text-white">Loading products...</p>
                ) : (
                    <>
                        <table className="w-full text-white text-sm">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="border-b border-gray-800">
                                        {headerGroup.headers.map((header) => (
                                            <th key={header.id} className="p-3 text-left font-semibold">
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

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-4">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                className={`px-4 py-1 rounded ${
                                    page === 1
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
                                className={`px-4 py-1 rounded ${
                                    page === totalPages
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-700 hover:bg-blue-800 text-white'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default AdminProductList
