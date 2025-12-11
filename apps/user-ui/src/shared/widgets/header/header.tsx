'use client'
import Link from 'next/link'
import React from 'react'
import { HeartIcon, Search, ShoppingBasket, User } from 'lucide-react'
import HeaderBottom from './header-bottom'
import useUser from 'apps/user-ui/src/hooks/useUser'
import { useStore } from 'apps/user-ui/src/store'

const Header = () => {

    const { user, isLoading } = useUser();

    const wishlist = useStore((state: any) => state.wishlist);
    const cart = useStore((state: any) => state.cart);

    return (
        <div className='w-full bg-white'>
            <div className='w-[80%] py-5 m-auto flex items-center justify-between'>
                <div>
                    <Link href={"/"}>
                        <span className='text-3xl font-[500]'>Shoplet</span>
                    </Link>
                </div>
                <div className='w-[50%] relative'>
                    <input type="text" placeholder='Search for products' className='w-full font-Poppins font-medium border-[2.5px] border-gray-400 rounded-md py-2 px-4' />
                    <div className='w-[60px] cursor-pointer flex items-center justify-center h-[42px] rounded-md absolute top-0 right-0 '>
                        <Search color='gray' />
                    </div>
                </div>
                <div className='flex items-center gap-8'>
                    <div className='flex items-center gap-2 '>
                        {!isLoading && user ? (
                            <>

                                <Link href={'/'} className='border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]'>
                                    <User size={30} />
                                </Link>

                                <Link href={'/profile'}>
                                    <span className='block font-medium'>Hello,</span>
                                    <span className='font-semibold'>{user?.name?.split(' ')[0]}</span>
                                </Link>

                            </>

                        ) : (
                            <>
                                <Link href={'/login'}>
                                    <User size={30} />
                                </Link>

                                <Link href={'/login'}>
                                    <span className='block font-medium'>Hello,</span>
                                    <span className='font-semibold'>{isLoading ? 'Loading...' : 'Sign In'}</span>
                                </Link>
                            </>
                        )}

                    </div>
                    <div className='flex items-center gap-5'>
                        <Link href={'/wishlist'} className='relative'>
                            <HeartIcon size={30} />
                            <div className='w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]'>
                                <span className='text-white text-sm font-medium'>{wishlist?.length}</span>
                            </div>
                        </Link>
                    </div>
                    <div className='flex items-center gap-5'>
                        <Link href={'/cart'} className='relative'>
                            <ShoppingBasket size={30} />
                            <div className='w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]'>
                                <span className='text-white text-sm font-medium'>{cart?.length}</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <div className='border-b border-b-[#99999938]' />
            <HeaderBottom />
        </div>
    )
}

export default Header