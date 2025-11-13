"use client";
import BreadCrumbs from "../../shared/components/breadcrumbs";
import React, { useMemo, useState, useDeferredValue } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender, getSortedRowModel } from "@tanstack/react-table";
import { Search, Download } from "lucide-react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axiosInstance from "../../shared/utils/axiosInstance";
import { saveAs } from "file-saver";
import Image from "next/image";

type Seller = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  shop: {
    name: string;
    avatar: string | string[]; // API returns [] or string
    address: string;
  };
};

type SellersResponse = {
  data: Seller[];
  meta: {
    totalSellers: number;
    currentPage: number;
    totalPages: number;
  };
};

const SellersPage = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const limit = 10;

  const { data, isLoading }: UseQueryResult<SellersResponse, Error> = useQuery({
    queryKey: ["sellers-list", page],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/api/get-all-sellers?page=${page}&limit=${limit}`);
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const allSellers = data?.data || [];

  // ✅ Fixed filter
  const filteredSellers = useMemo(() => {
    return allSellers.filter((seller) => {
      if (!deferredGlobalFilter) return true;
      const values = Object.values(seller)
        .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
        .join(" ")
        .toLowerCase();
      return values.includes(deferredGlobalFilter.toLowerCase());
    });
  }, [allSellers, deferredGlobalFilter]);

  const totalPages = Math.ceil((data?.meta?.totalSellers ?? 0) / limit);

  const columns = useMemo(
    () => [
      {
        accessorKey: "shop.avatar",
        header: "Avatar",
        cell: ({ row }: any) => {
          const avatar = row.original.shop?.avatar;
          const src =
            Array.isArray(avatar) && avatar.length > 0
              ? avatar[0]
              : typeof avatar === "string" && avatar
              ? avatar
              : "/placeholder.png";

          return (
            <Image
              src={src}
              alt={row.original.name}
              width={40}
              height={40}
              className="rounded-full w-10 h-10 object-cover"
            />
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "shop.name",
        header: "Shop Name",
        cell: ({ row }: any) => {
          const shopName = row.original.shop?.name;
          return shopName ? (
            <a
              href={`${process.env.NEXT_PUBLIC_SELLER_SERVER_URI}/shop/${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {shopName}
            </a>
          ) : (
            <span className="text-gray-400">No Shop</span>
          );
        },
      },
      {
        accessorKey: "shop.address",
        header: "Address",
        cell: ({ row }: any) => <span>{row.original.shop?.address || "—"}</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }: any) => (
          <span className="text-gray-400">
            {new Date(row.original.createdAt).toLocaleString()}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredSellers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const exportToCSV = () => {
    const csvData = filteredSellers.map(
      (seller) =>
        `${seller.name},${seller.email},${seller.shop?.name},${seller.shop?.address},${seller.createdAt}`
    );
    const blob = new Blob(
      [`Name,Email,Shop Name,Address,Created At\n${csvData.join("\n")}`],
      { type: "text/csv;charset=utf-8" }
    );
    saveAs(blob, `sellers-page-${page}.csv`);
  };

  return (
    <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl text-white font-semibold">All Sellers</h2>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center gap-2"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="mb-4">
        <BreadCrumbs title="All Sellers" />
      </div>

      {/* Search Bar */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search seller..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full bg-transparent text-white outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 p-4 rounded-lg">
        {isLoading ? (
          <p className="text-center text-white">Loading sellers...</p>
        ) : filteredSellers.length === 0 ? (
          <p className="text-center text-gray-400">No sellers found.</p>
        ) : (
          <table className="w-full text-white text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-left">
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
            className={`px-4 py-1 rounded ${
              page === 1
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 text-white"
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
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 text-white"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellersPage;
