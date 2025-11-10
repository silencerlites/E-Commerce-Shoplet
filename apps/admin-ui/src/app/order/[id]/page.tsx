"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import axiosInstance from "../../shared/utils/axiosInstance";
import { useParams, useRouter } from "next/navigation";

const statuses = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];

const Page = () => {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchOrder = async () => {
    try {
      const res = await axiosInstance.get(`/order/api/get-order-details/${orderId}`);
      setOrder(res.data.order);
    } catch (error) {
      console.log("Failed to fetch order details", error);
    } finally {
      setLoading(false);
    }
  };

    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[40vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-sm text-red-500">Order not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-gray-200">

      {/* Header */}
      <h1 className="text-2xl font-bold mb-2">Order #{order.id.slice(-6)}</h1>

          {/* Delivery Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
                {statuses.map((step, idx) => {
                    const current = step === order.deliveryStatus;
                    const passed = statuses.indexOf(order.deliveryStatus) >= idx;
                    return (
                        <div key={step}
                        className={`flex-1 text-left ${
                            current ? "text-blue-600" : passed ? "text-green-600" : "text-gray-400"
                        }`}>
                            {step}
                        </div>
                    )
                })}
            </div>
            <div className="flex items-center">
                {statuses.map((step, idx) => {
                    const reached = idx <= statuses.indexOf(order.deliveryStatus);
                    return (
                        <div key={step} className="flex-1 flex items-center"> 
                            <div className={`w-4 h-4 rounded-full ${reached ? "bg-blue-600" : "bg-gray-300"}`}/>
                            {idx !== statuses.length - 1 && (
                                <div className={`flex-1 h-1 ${reached ? "bg-blue-600" : "bg-gray-300"}`}/>
                            )}
                        </div>
                    )
                })}
            </div>
          </div>
    

      {/* Order Info */}
      <div className="mb-8 text-sm space-y-1">
        <p>
          <span className="font-semibold">Payment Status:</span>{" "}
          <span className="text-green-500 font-medium">{order.status}</span>
        </p>
        <p>
          <span className="font-semibold">Total Paid:</span> ${order.total.toFixed(2)}
        </p>
        

        {order.discountAmount > 0 && (
            <p>
                <span className="font-semibold">Discount Applied:</span>{" "}
                <span className="text-green-400">
                    -${order.discountAmount.toFixed(2)}
                    {order.couponCode?.discountType === "percentage" ?`${order.couponCode?.discountValue}%}` : `${order.couponCode?.discountValue}` } {" "}off
                </span>
            </p>
        )}

        {order.couponCode && (
            <p>
                <span className="font-semibold"> Coupon Used:</span>{" "}
                <span className="text-blue-400">{order.couponCode.public_name}</span>
            </p>
        )}

        <p>
          <span className="font-semibold">Date:</span>{" "}
          {new Date(order.createdAt).toLocaleDateString("en-GB")}
        </p>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="mb-10 text-sm">
          <h2 className="font-semibold text-md mb-2">Shipping Address</h2>
          <p>{order.shippingAddress.name}</p>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.city}, {" "}, {order.shippingAddress.zip}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="text-md font-semibold mb-3">Order Items</h2>
        <div className="bg-[#111827] border border-gray-700 rounded-md p-4 flex items-center gap-4">
          <img
            src={order.items?.[0]?.product?.images?.[0]?.url ?? "/placeholder.png"}
            alt="Product"
            className="w-14 h-14 object-cover rounded-md border border-gray-600"
          />
          <div className="flex-1">
            <p className="font-medium text-gray-200">{order.items?.[0]?.product?.title || "Unnamed Product"}</p>
            <p className="text-sm text-gray-400">
              Quantity: <span className="text-gray-200">{order.items?.[0]?.quantity}</span>
            </p>
            {order.items?.[0]?.size && (
              <p className="text-sm text-gray-400">
                Size: <span className="text-gray-200">{order.items?.[0]?.size}</span>
              </p>
            )}
          </div>
          <p className="text-gray-200 text-sm font-semibold">${order.items?.[0]?.price?.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default Page;
