"use client"
// import useLayout from "apps/user-ui/src/hooks/useLayout"
import { MoveRight } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React from "react"

const Hero = () => {
    const router = useRouter();
    // const { layout } = useLayout();

    return (
        <div className="bg-[#115061] h-[86vh] flex flex-col items-center justify-center w-full">
            <div className="md:w-[80%] w-[90%] m-auto md:flex h-full items-center">
                <div className="md:w-1/2">
                <p className="font-Roboto font-normal text-white pb-2 text-xl">
                    Starting from 40$
                </p>

                <h1 className="text-white text-6xl font-extrabold font-Roboto">
                    The best watch <br />
                    Collection 2025
                </h1>
                <p className="font-Oregano text-3xl pt-4 text-white">
                    Exclusive offer <span className="text-yellow-400">10% </span>
                    this week
                </p>
                <br />
                <button
                onClick={() => router.push("/products")}
                className="w-[140px] gap-2 font-semibold h-[40px] hover:text-white bg-white hover:bg-black flex items-center justify-center rounded-md text-black transition"
                >
                    Shop Now <MoveRight/>
                </button>
                </div>

                <div className="md:w-1/2 flex justify-center">
                <Image 
                src={"https://ik.imagekit.io/u4a8o785f/products/product-1754554849271_MsoIuY9P7.jpg?updatedAt=1754554851493"}
                alt=""
                width={450}
                height={450}/>
                </div>
            </div>
        </div>
    )
}

export default Hero