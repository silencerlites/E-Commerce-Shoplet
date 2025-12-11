import SellerProfile from 'apps/user-ui/src/shared/modules/seller/seller-profile';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance'
import { Metadata } from 'next';
import React from 'react'

async function fetchSellerDetails(id:string) {
    const response = await axiosInstance.get(`/seller/api/get-seller/${id}`);
    return response.data;
}

// Dyanamic metadata generator
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const data = await fetchSellerDetails(params.id);

    return {
        title: `${data?.shop?.name} | Shoplet`,
        description: data?.shop?.bio || "Discover high-quality product on Shoplet",
        openGraph: {
            title: data?.shop?.name,
            description: data?.shop?.bio || "",
            images: [{url: data?.shop?.images?.[0]?.url || "/default-image.jpg", width: 800, height: 600, alt: data?.shop?.name || "Shoplet"}],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: data?.shop?.name,
            description: data?.shop?.bio || "",
            images: [data?.shop?.images?.[0]?.url || "/default-image.jpg"],
        },
    }
    
}

const Page = async ({ params }: { params: { id: string } }) => {
    const data = await fetchSellerDetails(params.id);
  return (
    <div>
        <SellerProfile data={data}/>
    </div>
  )
}

export default Page