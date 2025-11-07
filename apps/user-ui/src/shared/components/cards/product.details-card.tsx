"use client"
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react'
import Ratings from '../ratings';
import { Heart, MapPin, ShoppingCartIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from 'apps/user-ui/src/store';
import useUser from 'apps/user-ui/src/hooks/useUser';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocation';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';


const ProductDetailsCard = ({ data, setOpen }: { data: any, setOpen: (open: boolean) => void }) => {

    const [activeImage, setActiveImage] = useState(0);
    const [isSelected, setIsSelected] = useState(data?.colors?.[0] || '');
    const [isSizeSelected, setIsSizeSelected] = useState(data?.sizes?.[0] || '');
    const [quantity, setQuantity] = useState(1);


    const addToWishlist = useStore((state: any) => state.addToWishlist);
    const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
    const wishlist = useStore((state: any) => state.wishlist);
    const isWishlisted = wishlist.some((item: any) => item.id === data.id);

    const addToCart = useStore((state: any) => state.addToCart);
    const cart = useStore((state: any) => state.cart);
    const isInCart = cart.some((item: any) => item.id === data.id);

    const { user } = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();


    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const router = useRouter();

    return (
        <div className='fixed flex items-center justify-center top-0 left-0 h-screen w-full bg-[#0000001d] z-50' onClick={() => setOpen(false)}>
            <div className='w-[90%] md:w-[70%] md:mt-14 2xl:mt-0 h-max overflow-scroll min-h-[70vh] p-4 md:p-6 bg-white shadow-md rounded-lg'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='w-full flex flex-col md:flex-row'>
                    <div className='w-full md:w-1/2 h-full'>
                        <Image
                            src={data?.images?.[activeImage]?.url}
                            alt={data?.images?.[activeImage].url}
                            width={400}
                            height={400}
                            className='rounded-lg object-contain' />
                        {/* Thumbnails */}
                        <div className='flex gap-2 mt-4'>
                            {data?.images?.map((img: any, index: number) => (
                                <div key={index} className={`cursor-pointer border rounded-md ${activeImage === index ? 'border-gray-500 pt-1' : 'border-transparent'}`}
                                    onClick={() => setActiveImage(index)}>
                                    <Image
                                        src={img?.url}
                                        alt={`Thumbnail ${index}`}
                                        width={80}
                                        height={80}
                                        className='rounded-md' />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='w-full md:w-1/2 md:pl-8 mt-6 md:mt-0'>
                        {/* Seller Info */}
                        <div className='border-b relative pb-3 border-gray-200 flex items-center justify-between'>
                            <div className='flex items-start gap-3'>
                                {/* Shop Logo */}
                                <Image src={data?.shop?.avatar} alt='Shop Logo' width={60} height={60} className='rounded-full w-[60px] object-cover' />
                                <div>
                                    <Link
                                        href={`/shop/${data?.shop?.id}`}
                                        className='text-lg font-medium'>
                                        {data?.shop?.name}
                                    </Link>

                                    {/* Shop Ratings */}
                                    <span className='block mt-1'>
                                        <Ratings rating={data?.shop?.rating} />
                                    </span>

                                    {/* Shop Location */}
                                    <p className='text-gray-600 mt-1 flex items-center gap-1'>
                                        <MapPin size={20} className='text-gray-600' /> {" "}
                                        {data?.shop?.address || "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* Chat with Seller Button */}
                            <button
                                className='flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg hover:scale-110 transition' onClick={() => router.push(`/chat/${data?.shop?.id}`)}>
                                💬 Chat with Seller
                            </button>

                            <button className='w-full absolute cursor-pointer right-[-5px] top-[-5px] flex justify-end my-2 mt-[-10px]'>
                                <X size={25} onClick={() => setOpen(false)} />
                            </button>
                        </div>

                        {/* Product Title */}
                        <h3 className='text-xl font-semibold mt-3'>{data?.title}</h3>
                        <p className='mt-2 text-gray-700 whitespace-pre-wrap w-full'>
                            {data?.short_description} {" "}
                        </p>

                        {/* Brand */}
                        {data?.brand && (
                            <p className='mt-2'>
                                <strong>Brand:</strong> {data?.brand}
                            </p>
                        )}

                        {/* Color & Size Selection */}
                        <div className='flex flex-col md:flex-row items-start gap-5 mt-4'>
                            {/* Color Options */}
                            {data?.colors?.length > 0 && (
                                <div>
                                    <strong>Colors:</strong>
                                    <div className='flex gap-2 mt-1'>
                                        {data.colors.map((color: string, index: number) => (
                                            <button key={index} className={`w-8 h-8 cursor-pointer rounded-full border-2 transition ${isSelected === color
                                                ? "border-gray-400 scale-110 shadow-md"
                                                : "border-transparent"}`}
                                                onClick={() => setIsSelected(color)}
                                                style={{ backgroundColor: color }}
                                            ></button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size Options */}
                            {data?.sizes?.length > 0 && (
                                <div>
                                    <strong>Size:</strong>
                                    <div className='flex gap-2 mt-1'>
                                        {data.sizes.map((size: string, index: number) => (
                                            <button key={index} className={`px-4 py-1 cursor-pointer rounded-md transition ${isSizeSelected === size
                                                ? "bg-gray-800 text-white"
                                                : "bg-gray-300 text-black"}`}
                                                onClick={() => setIsSizeSelected(size)}
                                            > {size} </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Price Section */}


                        <div className='mt-5 flex gap-4 items-center'>

                            <h3 className='text-4xl font-bold text-red-600'>
                                ₱ {data?.sale_price}
                            </h3>
                            {data?.regular_price && (
                                <p className='text-lg text-gray-600 line-through'>
                                    {data?.regular_price}
                                </p>
                            )}
                        </div>





                        <div className='mt-5 flex items-center gap-5'>
                            {/* Quantity */}
                            <div className='flex items-center rounded-md'>
                                <button className='px-3 cursor-pointer py-1 bg-gray-300 hover:bg-gray-400'
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                                    -
                                </button>

                                <span className='px-4 bg-gray-100 py-1'>{quantity}</span>
                                <button
                                    className='px-3 cursor-pointer py-1 bg-gray-300 hover:bg-gray-400'
                                    onClick={() => setQuantity((prev) => prev + 1)}>
                                    +
                                </button>
                            </div>

                            {/* Add to Cart Button */}

                            <button disabled={isInCart} onClick={() => addToCart({
                                ...data,
                                selectedOption: {
                                    color: isSelected,
                                    size: isSizeSelected
                                },
                                quantity
                            },
                                user,
                                location,
                                deviceInfo
                            )} className={`flex items-center gap-2 px-4 py-2 bg-[#02a525] hover:bg-[#008616] text-white font-medium rounded-lg transition ${isInCart ? "cursor-not-allowed" : "cursor-pointer"}`}>
                                <ShoppingCartIcon size={18} />
                                Add to Cart
                            </button>

                            <button onClick={() => isWishlisted ?
                                        removeFromWishlist(data.id, user, location, deviceInfo) :
                                        addToWishlist(
                                            {
                                                ...data,
                                                quantity,
                                                selectedOption: {
                                                    color: isSelected,
                                                    size: isSizeSelected
                                                }
                                            },
                                            user,
                                            location,
                                            deviceInfo
                                        )
                                    } className='flex items-center gap-2 px-4 py-2 bg-[#ff5722] hover:bg-[#e64a19] text-white font-medium rounded-lg transition '>
                                <Heart size={18} fill={isWishlisted ? "white" : "transparent"} color={isWishlisted ? "transparent" : "white"}
                                    
                                /> Add Wishlist
                            </button>
                        </div>

                        {/* Stock Status */}
                        <div className='mt-3'>
                            {data?.stock > 0 ? (
                                <div>
                                    <span className='text-green-600 font-bold'> In Stock</span> -  Estimated Delivery: {" "}
                                    <strong>{estimatedDelivery.toDateString()}</strong>

                                </div>
                            ) : (
                                <span className='text-red-600 font-semibold'>
                                    Out of Stock
                                </span>
                            )}
                        </div> {" "}

                        {/* Estimated Delivery */}
                        <div className='mt-3 text-gray-600 text-sm'>

                        </div>


                    </div>
                </div>

            </div>

        </div>
    )
}

export default ProductDetailsCard