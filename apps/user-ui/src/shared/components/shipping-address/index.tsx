"use client"
import React, { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance'
import { countries } from 'apps/user-ui/src/utils/countries'
import { Plus, Trash2, MapPin, X } from 'lucide-react'

const ShippingAddressSection = () => {
    const [showModal, setShowModal] = useState(false);
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            label: "Home",
            name: "",
            street: "",
            city: "",
            zip: "",
            country: "Philippines",
            isDefault: "false",
        }
    });

    //   Get addresses
    const { data: addresses, isLoading } = useQuery({
        queryKey: ["shipping-addresses"],
        queryFn: async () => {
            const res = await axiosInstance.get("/api/shipping-addresses");
            return res.data.addresses;
        }
    })

    // Add address mutation
    const { mutate: addAddress } = useMutation({
        mutationFn: async (payload: any) => {
            const res = await axiosInstance.post("/api/add-address", payload);
            return res.data.address;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
            reset();
            setShowModal(false);
        }
    })

    // Delete address mutation
    const { mutate: deleteAddress } = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(`/api/delete-address/${id}`);

        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
        }
    })

    const onSubmit = (data: any) => {
        addAddress({
            ...data,
            isDefault: data.isDefault === "true",
        });
    };

    return (
        <div className='space-y-4'>
            {/* Header */}
            <div className='flex justify-between items-center'>
                <h2 className='text-lg font-semibold text-gray-800'>Saved Addresses</h2>
                <button onClick={() => setShowModal(true)}
                    className='flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline'>
                    <Plus className='w-4 h-4' /> Add New Address
                </button>
            </div>

            {/* Address List */}
            {isLoading ? (
                <p className='text-sm text-gray-500'>Loading addresses...</p>
            ) : !addresses || addresses.length === 0 ? (
                <p className='text-sm text-gray-500'>No addresses found.</p>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {addresses.map((address: any) => (
                        <div key={address.id} className='border border-gray-200 rounded-md p-4 relative'>
                            {address.isDefault && (
                                <span className='absolute top-2 right-2 bg-blue-100 text-blue-600 rounded px-2 py-1 text-xs'> Default</span>
                            )}
                            <div className='flex items-start gap-2 text-sm text-gray-700'>
                                <MapPin className='w-5 h-5 mt-0.5 text-gray-500' />
                                <div>
                                    <p className='font-medium'>
                                        {address.label} - {address.name}
                                    </p>
                                    <p>
                                        {address.street}, {address.city}, {address.zip}, {address.country}
                                    </p>
                                </div>
                            </div>
                            <div className='flex gap-3 mt-4'>
                                <button className='flex items-center gap-1 !cursor-pointer text-xs text-red-500' onClick={() => deleteAddress(address.id)}>
                                    <Trash2 className='w-4 h-4' /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50'>
                    <div className='bg-white w-full max-w-md p-6 rounded-md shadow-md relative'>
                        <button onClick={() => setShowModal(false)}
                            className='absolute top-3 right-3 text-gray-500 hover:text-gray-800'>
                            <X className='w-5 h-5' />
                        </button>
                        <h3 className='text-lg font-semibold mb-4 text-gray-800'>Add New Address</h3>

                        <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
                            <select {...register("label")} className='form-input'>  
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Other">Other</option>
                            </select>

                            <input placeholder='Name' {...register("name", { required: "Name is required" })} className='form-input' />
                            {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}

                            <input placeholder='Street' {...register("street", { required: "Street is required" })} className='form-input' />
                            {errors.street && <p className='text-red-500 text-sm'>{errors.street.message}</p>}

                            <input placeholder='City' {...register("city", { required: "City is required" })} className='form-input' />
                            {errors.city && <p className='text-red-500 text-sm'>{errors.city.message}</p>}

                            <input placeholder='ZIP Code' {...register("zip", { required: "ZIP Code is required" })} className='form-input' />
                            {errors.zip && <p className='text-red-500 text-sm'>{errors.zip.message}</p>}

                            <select {...register("country")} className='form-input'>
                                {countries.map((country) => (
                                    <option key={country} value={country}>
                                        {country}
                                    </option>
                                ))}
                            </select>

                            <select {...register("isDefault")} className='form-input'>
                                <option value="true">Set as Default</option>
                                <option value="false">Not Default</option>
                            </select>

                            <button type='submit' className='w-full bg-blue-500 text-white py-2 text-sm rounded-md hover:bg-blue-600 transition'>
                                Save Address
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ShippingAddressSection