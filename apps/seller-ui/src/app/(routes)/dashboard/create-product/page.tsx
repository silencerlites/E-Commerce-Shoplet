"use client"
import ImagePlaceholder from 'apps/seller-ui/src/shared/components/image-placeholder';
import { ChevronRight, Wand, X } from 'lucide-react'
import Input from 'packages/components/input';
import React, { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import ColorSelector from 'packages/components/color-selector';
import CustomSpecification from 'packages/components/custom-specification';
import CustomProperties from 'packages/components/custom-properties';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import RichTextEditor from 'packages/components/rich-text-editor';
import SizeSelector from 'packages/components/size-selector';
import Image from 'next/image';
import { enhancements } from 'apps/seller-ui/src/utils/AI.enchancements';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface UploadImage {
    fileId: string;
    file_url: string;
}


const Page = () => {
    const {
        register,
        control,
        watch,
        setValue,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const [openImageModal, setOpenIMageModal] = useState(false);
    const [isChanged, setIsChanged] = useState(true);
    const [activeEffect, setActiveEffect] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [pictureUploadingLoader, setPictureUploadingLoader] = useState(false)
    const [images, setImages] = useState<(UploadImage | null)[]>([null]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    const { data, isLoading, isError } = useQuery({

        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/product/api/get-categories');
            return data ?? []; // 👈 ensure it's not undefined
        },
        staleTime: 1000 * 60 * 5,
        retry: 2
    })

    const { data: discountcodes = [], isLoading: discountLoading } = useQuery({
        queryKey: ['discount_code'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/get-discount-codes');
            return res?.data?.discount_code || [];
        }
    })

    const categories = data?.categories || [];
    const subCategoriesData = data?.subCategories || {};

    const selectedCategory = watch('category');
    const regularPrice = watch('regular_price');

    const subcategories = useMemo(() => {
        return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
    }, [selectedCategory, subCategoriesData]);


    const onSubmit = async (data: any) => {
        console.log(data);
        try {
            await axiosInstance.post('/product/api/create-product', data);
            router.push('/dashboard/all-products');
        } catch (error: any) {
            toast.error(error?.data?.message);
        } finally {
            setLoading(false);
        }
    }

    const convertFileToBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        })
    }

    const handleImageChange = async (file: File | null, index: number) => {
        if (!file) return;
        setPictureUploadingLoader(true);

        try {
            const fileName = await convertFileToBase64(file);
            const response = await axiosInstance.post('/product/api/upload-product-image', { fileName });

            const uploadedImage: UploadImage = {
                fileId: response.data.fileId,
                file_url: response.data.file_url
            }

            const updateImages = [...images];

            updateImages[index] = uploadedImage;
            console.log(uploadedImage)

            if (index === images.length - 1 && updateImages.length < 8) {
                updateImages.push(null)
            }

            setImages(updateImages);
            setValue('images', updateImages);
        } catch (error) {
            console.log(error)
        } finally {
            setPictureUploadingLoader(false);
        }
    }

    const handleRemoveImage = async (index: number) => {
        try {
            const updatedImages = [...images];

            const imageToDelete = updatedImages[index];
            console.log(imageToDelete)
            if (imageToDelete && typeof imageToDelete === "object") {
                await axiosInstance.delete("/product/api/delete-product-image", {
                    data: {
                        fileId: imageToDelete.fileId,
                    }
                });
            }

            updatedImages.splice(index, 1);

            // Add null placeholder
            if (!updatedImages.includes(null) && updatedImages.length < 8) {
                updatedImages.push(null)
            };

            setImages(updatedImages);
            setValue('images', updatedImages);
        } catch (error) {
            console.log(error)
        }
    }

    const applyTransformation = async (transformation: string) => {
        if (!selectedImage || processing) return;
        setProcessing(true)
        setActiveEffect(transformation)

        try {
            const transformedUrl = `${selectedImage}?tr=${transformation}`
            setSelectedImage(transformedUrl);
        } catch (error) {
            console.log(error)
        } finally {
            setProcessing(false)
        }
    }


    const handleSaveDraft = () => {

    }

    return (
        <form className='w-full mx-auto p-8 shadow-md rounded-lg text-white' onSubmit={handleSubmit(onSubmit)}>
            {/* Heading & Breadcrumbs */}
            <h2 className='text-2xl py-2 font-semibold font-Poppins text-white'>
                Create Product
            </h2>
            <div className='flex items-center'>
                <span className='text-[#80Deea] cursor-pointer'>Dashboard</span>
                <ChevronRight size={20} className='opacity-[.8]' />
                <span>Create Product</span>
            </div>

            {/* Content Layout */}
            <div className='py-4 w-full flex gap-6'>
                {/* Left Side - Image upload section */}
                <div className='md:w-[35%]'>
                    {images?.length > 0 && (
                        <ImagePlaceholder
                            setOpenIMageModal={setOpenIMageModal}
                            size="765 x850"
                            pictureUploadingLoader={pictureUploadingLoader}
                            small={false}
                            images={images}
                            index={0}
                            onImageChange={handleImageChange}
                            setSelectedImage={setSelectedImage}
                            onRemove={handleRemoveImage}
                        />
                    )}


                    <div className='grid grid-cols-2 gap-3 mt-4'>
                        {images.slice(1).map((_, index) => (
                            <ImagePlaceholder
                                setOpenIMageModal={setOpenIMageModal}
                                size="765 x 850"
                                pictureUploadingLoader={pictureUploadingLoader}
                                images={images}
                                key={index}
                                small
                                index={index + 1}
                                onImageChange={handleImageChange}
                                setSelectedImage={setSelectedImage}
                                onRemove={handleRemoveImage}
                            />
                        ))}

                    </div>
                </div>



                {/* Right side - form inputs */}
                <div className='w-[65%]'>
                    <div className='w-full flex gap-6'>
                        <div className='w-2/4'>
                            {/* Product Title Input */}
                            <Input label="Product Title" placeholder='Enter Product Title' {...register('title', { required: "Title is required" })} />
                            {errors.title && <p className='text-red-500 text-sm mt-1'>{errors.title.message as string}</p>}

                            {/* Product Description */}
                            <div className='mt-2'>
                                <Input
                                    type='textarea'
                                    rows={7}
                                    cols={10}
                                    label='Short Description (Max 150 words)'
                                    placeholder='Enter Product Description for quick view'
                                    {...register('short_description', {
                                        required: "Description is required",
                                        validate: (value) => {
                                            const wordCount = value.trim().split(/\s+/).length;
                                            return (wordCount <= 150 || `Description can't exceed 150 words (Current: ${wordCount})`)
                                        }
                                    })} />
                                {errors.description && <p className='text-red-500 text-sm mt-1'>{errors.description.message as string}</p>}
                            </div>

                            {/* Product Tags */}
                            <div className='mt-2'>
                                <Input
                                    label='Tags'
                                    placeholder='apple, flagship'
                                    {...register('tags', {
                                        required: "Seperate related product tags with a coma,",
                                    })} />
                                {errors.tags && <p className='text-red-500 text-sm mt-1'>{errors.tags.message as string}</p>}
                            </div>

                            {/* Product Warranty */}
                            <div className='mt-2'>
                                <Input
                                    label='Warranty'
                                    placeholder='1 Year / No Warranty'
                                    {...register('warranty', {
                                        required: "Warranty is required!",
                                    })} />
                                {errors.warranty && <p className='text-red-500 text-sm mt-1'>{errors.warranty.message as string}</p>}
                            </div>

                            {/* Product Slug */}
                            <div className='mt-2'>
                                <Input
                                    label='Slug'
                                    placeholder='Product Slug'
                                    {...register('slug', {
                                        required: "Slug is required!",
                                        pattern: {
                                            value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                                            message: "Slug must contain only lowercase letters, numbers, and hyphens."
                                        },
                                        minLength: {
                                            value: 3,
                                            message: "Slug must be at least 3 characters long."
                                        },
                                        maxLength: {
                                            value: 50,
                                            message: "Slug can't exceed 50 characters."
                                        },
                                    })} />
                                {errors.slug && <p className='text-red-500 text-sm mt-1'>{errors.slug.message as string}</p>}
                            </div>

                            {/* Product Brand */}
                            <div className='mt-2'>
                                <Input
                                    label='Brand'
                                    placeholder='Apple'
                                    {...register('brand')} />
                                {errors.brand && <p className='text-red-500 text-sm mt-1'>{errors.brand.message as string}</p>}
                            </div>

                            {/* Product Brand */}
                            <div className='mt-2'>
                                <ColorSelector control={control} errors={errors} />
                            </div>

                            {/* Custom Specification */}
                            <div className='mt-2'>
                                <CustomSpecification control={control} errors={errors} />
                            </div>

                            {/* Custom Properties */}
                            <div className='mt-2'>
                                <CustomProperties control={control} errors={errors} />
                            </div>

                            {/* Payment Method */}
                            <div className='mt-2'>
                                <label className='block font-semibold text-gray-300 mb-1'>
                                    Cash On Delivery
                                </label>
                                <select {...register('cash_on_delivery', {
                                    required: "Cash On Delivery is required!"
                                })}
                                    defaultValue="yes"
                                    className='w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white'>
                                    <option value="yes" className='bg-black'>Yes</option>
                                    <option value="no" className='bg-black'>No</option>
                                </select>
                            </div>
                        </div>


                        <div className='w-2/4'>
                            {/* category */}
                            <label htmlFor="block font-semibold text-gray-300 mb-1">
                                Category
                            </label>
                            {
                                isLoading ? (
                                    <p className='text-gray-400'> Loading...</p>
                                ) : isError ? (
                                    <p className='text-red-500'>
                                        Failed to load categories

                                    </p>
                                ) : (
                                    <Controller
                                        name='category'
                                        control={control}
                                        rules={{ required: "Category is required!" }}
                                        render={({ field }) => (
                                            <select
                                                {...field}
                                                className='w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white mt-1'
                                            >
                                                <option value="" className='bg-black'>
                                                    Select Category
                                                </option>
                                                {categories?.map((category: string) => (
                                                    <option value={category} key={category}
                                                        className='bg-black'
                                                    >
                                                        {category}
                                                    </option>
                                                ))}

                                            </select>
                                        )}
                                    />
                                )
                            }
                            {errors.category && <p className='text-red-500 text-sm mt-1'>{errors.category.message as string}</p>}
                            {/* subcategory */}
                            <div className='mt-2'>
                                <label className='block font-semibold text-gray-300 mb-1'>
                                    Subcategory
                                </label>
                                <Controller
                                    name='subCategory'
                                    control={control}
                                    rules={{ required: "Subcategory is required!" }}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className='w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white mt-1'
                                        >
                                            <option value="" className='bg-black'>
                                                Select Subcategory
                                            </option>
                                            {subcategories?.map((subcategory: string) => (
                                                <option value={subcategory} key={subcategory}
                                                    className='bg-black'
                                                >
                                                    {subcategory}
                                                </option>
                                            ))}

                                        </select>
                                    )}
                                />
                            </div>
                            {/* detail description */}
                            <div className='mt-2'>
                                <label className='block font-semibold text-gray-300 mb-1'>
                                    Detailed Description (Min 100 words)
                                </label>
                                <Controller name='detailed_description'
                                    control={control}
                                    rules={{
                                        required: "Detailed description is required!",
                                        validate: (value) => {
                                            const wordCount = value?.split(/\s+/).filter((word: string) => word).length;
                                            return (
                                                wordCount >= 100 ||
                                                `Description should have at least 100 words!`
                                            );
                                        }
                                    }}
                                    render={({ field }) => (
                                        <RichTextEditor
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                                {errors.detailed_description && <p className='text-red-500 text-sm mt-1'>{errors.detailed_description.message as string}</p>}
                            </div>
                            {/* video url */}
                            <div className='mt-2'>
                                <Input
                                    label='Video URL'
                                    placeholder='https://www.youtube.com/embed/xyz123'
                                    {...register('video_url', {
                                        pattern: {
                                            value: /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|embed\/)[a-zA-Z0-9_-]{11}(&.*)?$/,
                                            message: 'Invalid Youtube embed URL! Use format: https://www.youtube.com/embed/xyz123'
                                        }
                                    })}
                                />
                                {errors.video_url && <p className='text-red-500 text-sm mt-1'>{errors.video_url.message as string}</p>}
                            </div>
                            {/* regular price */}
                            <div className='mt-2'>
                                <Input
                                    label='Regular Price'
                                    placeholder='20'
                                    {...register('regular_price', {
                                        valueAsNumber: true,
                                        min: {
                                            value: 1,
                                            message: 'Regular price must be at least 1'
                                        },
                                        validate: (value) => !isNaN(value) || "Only numbers are allowed!"

                                    })}
                                />
                                {errors.regular_price && <p className='text-red-500 text-sm mt-1'>{errors.regular_price.message as string}</p>}
                            </div>
                            {/* sale price */}
                            <div className='mt-2'>
                                <Input
                                    label='Sale Price'
                                    placeholder='15'
                                    {...register('sale_price', {
                                        required: "Sale price is required!",
                                        valueAsNumber: true,
                                        min: {
                                            value: 1,
                                            message: 'Regular price must be at least 1'
                                        },
                                        validate: (value) => {
                                            if (isNaN(value)) return "Only numbers are allowed!";
                                            if (regularPrice && value >= regularPrice) {
                                                return "Sale price must be less than regular price"
                                            };
                                            return true;
                                        },

                                    })}
                                />
                                {errors.sale_price && <p className='text-red-500 text-sm mt-1'>{errors.sale_price.message as string}</p>}
                            </div>
                            {/* stock */}
                            <div className='mt-2'>
                                <Input
                                    label='Stock'
                                    placeholder='100'
                                    {...register('stocks', {
                                        required: "Stocks is required!",
                                        valueAsNumber: true,
                                        min: {
                                            value: 1,
                                            message: 'Stocks must be at least 1'
                                        },
                                        max: {
                                            value: 1000,
                                            message: 'Stocks cannot exceed 1000'
                                        },
                                        validate: (value) => {
                                            if (isNaN(value)) return "Only numbers are allowed!";
                                            return true;
                                        },

                                    })}
                                />
                                {errors.stocks && <p className='text-red-500 text-sm mt-1'>{errors.stocks.message as string}</p>}
                            </div>
                            {/* size select */}
                            <div className='mt-2'>
                                <SizeSelector control={control} errors={errors} />
                            </div>
                            {/* discount selector */}
                            <div className='mt-3'>
                                <label className='block font-semibold text-gray-300 mb-1'>
                                    Select Discount Codes (optional)
                                </label>
                                {discountLoading ? (
                                    <p className='text-gray-400'> Loading discount codes...</p>
                                ) : (
                                    <div className='flex flex-wrap gap-2'>
                                        {discountcodes?.map((discount: any) => (
                                            <button key={discount.id}
                                                type='button'
                                                className={`px-3 py-1 rounded-md text-sm font-semibold border ${watch("discountcodes")?.includes(discount.id) ? "bg-blue-600 text-white border-blue-600" : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"}`}
                                                onClick={() => {
                                                    const currentSelection = watch("discountcodes") || [];
                                                    const updatedSelection = currentSelection?.includes(discount.id) ? currentSelection.filter((id: string) => id !== discountcodes.id) : [...currentSelection, discount.id];
                                                    setValue("discountcodes", updatedSelection);
                                                }}
                                            >
                                                {discount.public_name} ({discount.discountValue} {discount.discountType === "percentage" ? "%" : "₱"})
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {openImageModal && (
                        <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60 z-50'>
                            <div className='bg-gray-800 p-6 rounded-lg w-[450px] text-white'>
                                <div className='flex justify-between items-center pb-3 mb-4'>
                                    <h2 className='text-lg font-semibold'> Enchance Product Image </h2>
                                    <X size={20} className='cursor-pointer' onClick={() => setOpenIMageModal(!openImageModal)} />
                                </div>
                                <div className='w-full h-[250px] rounded-md overflow-hidden border border-gray-600 relative'>
                                    <Image
                                        src={selectedImage}
                                        alt="product-image"
                                        fill
                                        sizes="100vw"
                                        className="object-contain"
                                        unoptimized // prevents Next.js from proxying it
                                    />
                                </div>
                                {selectedImage && (
                                    <div className='mt-4 space-y-2'>
                                        <h3 className='text-white text-sm font-semibold'> AI Enchacements</h3>
                                        <div className='grid grid-cols-2 gap-3 mx-h-[250px] overflow-y-auto'>
                                            {enhancements?.map(({ label, effect }) => (
                                                <button
                                                    key={effect}
                                                    className={`p-2 rounded-md flex items-center gap-2 ${activeEffect === effect ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600"}`}
                                                    onClick={() => applyTransformation(effect)}
                                                    disabled={processing}
                                                >
                                                    <Wand size={18} />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>

                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
                {isChanged && (
                    <button type='button'
                        onClick={handleSaveDraft}
                        className='px-4 py-2 bg-gray-700 text-white rounded-md'
                    >
                        Save Draft
                    </button>
                )}
                <button type='submit'
                    className='px-4 py-2 bg-blue-600 text-white rounded-md'
                    disabled={loading}>
                    {loading ? "Creating..." : "Create"}
                </button>
            </div>
        </form>
    )
}

export default Page