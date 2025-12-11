'use client'
import { useQuery } from '@tanstack/react-query';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocation';
import useUser from 'apps/user-ui/src/hooks/useUser';
import { useStore } from 'apps/user-ui/src/store';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

const CartPage = () => {

    const { user } = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const cart = useStore((state: any) => state.cart);
    const router = useRouter();

    const [discountedProductId, setDiscountedProductId] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);

    const [couponCode, setCouponCode] = useState("");

    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [error, setError] = useState("");
    const [storedCouponCode, setStoredCouponCode] = useState("");


    const couponCodeApplyHandler = async () => {
        setError("");

        if (!couponCode.trim()) {
            setError("Coupon code is required!");
            return;
        }

        try {
            const res = await axiosInstance.put('/order/api/verify-coupon', { couponCode: couponCode.trim(), cart });

            if (res.data.valid) {
                setStoredCouponCode(couponCode);
                setDiscountAmount(parseFloat(res.data.discountAmount));
                setDiscountPercentage(parseFloat(res.data.discountPercentage));
                setDiscountedProductId(res.data.discountedProductId);
                setCouponCode("");
            }
            else {
                setDiscountAmount(0);
                setDiscountPercentage(0);
                setDiscountedProductId("");
                setError(res.data.message || "Coupon not valid for any items in cart!");
            }


        } catch (error: any) {
            setDiscountAmount(0);
            setDiscountPercentage(0);
            setDiscountedProductId("");
            setError(error?.response?.data?.message);
        }
    }

    const createPaymentSession = async () => {
        if (addresses?.length === 0) {
            toast.error("Please set your delivery address to create an order!");
            return;
        }
        setLoading(true);
        try {

            const res = await axiosInstance.post('/order/api/create-payment-session', {
                cart,
                selectedAddressId,
                coupon: {
                    code: storedCouponCode,
                    discountAmount,
                    discountPercentage,
                    discountedProductId
                }, // or your real coupon data
            });

            const sessionId = res.data?.sessionId;
            if (!sessionId) throw new Error("No sessionId returned");

            router.push(`/checkout?sessionId=${sessionId}`);
        } catch (error: any) {
            console.error("Error creating payment session:", error);
            toast.error("Something went wrong while creating payment session.");
        } finally {
            setLoading(false);
        }
    };

    const revomeFromCart = useStore((state: any) => state.removeFromCart);
    const [loading, setLoading] = useState(false);

    const increaseQuantity = (id: string) => {
        useStore.setState((state: any) => ({
            cart: state.cart.map((item: any) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
        }))
    }

    const decreaseQuantity = (id: string) => {
        useStore.setState((state: any) => ({
            cart: state.cart.map((item: any) => item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item)
        }))
    }

    const subTotal = cart.reduce((total: number, item: any) => total + item.quantity * item.sale_price, 0); // Calculate sub-total

    const removeItem = (id: string) => {
        revomeFromCart(id, user, location, deviceInfo)
    }

    // Get Addresses
    const { data: addresses = [] } = useQuery<any[], Error>({
        queryKey: ['shipping-addresses'],
        queryFn: async () => {
            const res = await axiosInstance.get('/api/shipping-addresses');
            return res.data.addresses;
        },
    });

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses?.find((addr) => addr.isDefault);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
            }
        }
    }, [addresses, selectedAddressId])


    return (
        <div className='w-full bg-white'>
            <div className='md:w-[80%] w-[95%] mx-auto min-h-screen'>
                <div className='pb-[50px]'>
                    <h1 className='md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost'>
                        Shopping Cart
                    </h1>
                    <Link href={"/"} className='text-[#55585b] hover:underline'>
                        Home
                    </Link>
                    <span className='inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full'></span>
                    <span className='text-[#55585b]'>Shopping Cart</span>
                </div>

                {cart.length === 0 ? (
                    <div className='text-center text-gray-600 text-lg'>
                        Your cart is empty!
                    </div>
                ) : (
                    <div className='lg:flex items-start gap-10'>
                        <table className='w-full lg:w-[70%] border-collapse'>
                            <thead className='bg-[#f1f3f4] rounded'>
                                <tr>
                                    <th className='py-3 text-left pl-6 align-middle'>Product</th>
                                    <th className='py-3 text-center align-middle'>Price</th>
                                    <th className='py-3 text-center align-middle'>Quantity</th>
                                    <th className='py-3 text-center align-middle'></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart?.map((item: any) => (
                                    <tr key={item.id} className='border-b border-[#0000000e]'>
                                        <td className='flex items-center gap-4 p-4'>
                                            <Image
                                                src={item?.images[0]?.url} alt={item.title} width={80} height={80} className='rounded' />
                                            <div className='flex flex-col'>
                                                <span className='font-medium'>{item.title}</span>
                                                {item?.selectedOption && (
                                                    <div className='text-sm text-gray-500'>
                                                        {item?.selectedOption?.color && (
                                                            <span> Color: { } <span style={{ backgroundColor: item?.selectedOption?.color, width: "12px", height: "12px", display: "inline-block", borderRadius: "100%" }} /></span>
                                                        )}
                                                        {item?.selectedOption?.size && (
                                                            <span> Size: {item?.selectedOption?.size}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className='px-6 text-lg text-center'>
                                            {item?.id === discountedProductId ? (
                                                <div className='flex flex-col items-center'>

                                                    <span className='line-through text-gray-500 text-sm'>
                                                        {item?.sale_price.toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </span> {" "}

                                                    <span className='text-green-600 font-semibold'>
                                                        ₱{(
                                                            (item.sale_price * (100 - discountPercentage)) / 100
                                                        ).toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </span>

                                                    <span className='text-xs text-green-700 bg-green-200'>
                                                        Discount Applied
                                                    </span>

                                                </div>
                                            ) : (
                                                <span>
                                                    ₱{item?.sale_price.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className='flex justify-center items-center border border-gray-200 rounded-[20px] w-[90px] p-[2px]'>
                                                <button className='text-black cursor-pointer text-xl' onClick={() => decreaseQuantity(item.id)}>
                                                    -
                                                </button>
                                                <span className='px-4'>{item?.quantity}</span>
                                                <button className='text-black cursor-pointer text-xl' onClick={() => increaseQuantity(item?.id)}>
                                                    +
                                                </button>
                                            </div>
                                        </td>

                                        <td className='text-center'>
                                            <button className='text-[#818487] cursor-pointer hever:text-[#ff1826] transition duration-200' onClick={() => removeItem(item?.id)}>
                                                Remove
                                            </button>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className='p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9f9] rounded-lg'>
                            {discountAmount > 0 && (
                                <div className='flex justify-between items-center text-[#010f1c] text-base font-medium pb-1'>
                                    <span className='font-jost'>Discount ({discountPercentage}%)</span>
                                    <span className='text-green-600'>- ₱{discountAmount.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</span>
                                </div>
                            )}

                            <div className='flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3'>
                                <span className='font-jost'>Subtotal </span>
                                <span>₱{(subTotal - discountAmount).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</span>
                            </div>
                            <hr className='my-4 text-slate-200' />

                            <div className='mb-4'>
                                <h4 className='mb-[7px] font-[500] text-[15px]'>
                                    Have a Coupon?
                                </h4>
                                <div className='flex'>
                                    <input type="text" value={couponCode} onChange={(e: any) => setCouponCode(e.target.value)} placeholder='Enter your coupon code' className='w-full p-2 border border-gray-200 rounded-l-md focus:outline-none focus:border-blue-500' />
                                    <button className='bg-blue-500 cursor-pointer text-white px-4 rounded-r-md hover:bg-blue-600 transition-all'
                                        onClick={() => couponCodeApplyHandler()}
                                    >
                                        Apply
                                    </button>

                                </div>
                                {error &&
                                    <p className='text-sm pt-2 text-red-500'>{error}</p>
                                }
                                <hr className='my-4 text-slate-200' />

                                <div className='mb-4'>
                                    <h4 className='mb-[7px] font-medium text-[15px]'>
                                        Select Shipping Address
                                    </h4>
                                    {addresses?.length !== 0 && (
                                        <select className='w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500' value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                                            {addresses?.map((address: any) => (
                                                <option key={address?.id} value={address.id}>
                                                    {address.label} - {address.city}, {address.country}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {addresses?.length === 0 && (
                                        <p className='text-sm pt-2 text-slate-800'>Please add an address from profile to create an order</p>
                                    )}
                                </div>

                                <hr className='my-4 text-slate-200' />

                                <div className='mb-4 '>
                                    <h4 className='mb-[7px] font-[500] text-[15px]'>
                                        Select Payment Method
                                    </h4>
                                </div>

                                <select className='w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500'>
                                    <option value="credit_card">Online Payment</option>
                                    <option value="cash_on_delivery">Cash on Delivery</option>
                                </select>
                            </div>

                            <hr className='my-4 text-slate-200' />

                            <div className='flex justify-between item-center text-[#010f1c] text-[20px] font-[550] pb-3'>
                                <span className='font-jost'>Total</span>
                                <span>₱{(subTotal - discountAmount).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</span>
                            </div>

                            <button
                                onClick={createPaymentSession}
                                disabled={loading}
                                className='w-full flex items-center gap-2 cursor-pointer justify-center h-[42px] rounded-md bg-blue-500 text-white'
                            >
                                {loading && <Loader2 className='animate-spin w-5 h-5' />}
                                {loading ? "Redirecting..." : "Proceed to Checkout"}
                            </button>

                        </div>


                    </div>
                )}
            </div>
        </div>
    )
}

export default CartPage