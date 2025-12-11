import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../shared/utils/axiosInstance"
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// fetch admin data from API
const fetchAdmin = async () => {
    try {
    const response = await axiosInstance.get("/api/logged-in-admin");

    // Log it once to confirm structure
    console.log("Admin response:", response.data);

    // Ensure the function never returns undefined
    if (response.data && response.data.admin) {
      return response.data.admin;
    }

    // Throw an error so React Query can handle it instead of returning undefined
    throw new Error("Admin data missing in response");
  } catch (error) {
    // Let React Query handle the error state
    throw error;
  }
}

const useAdmin = () => {
    const {
        data: admin,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin"],
        queryFn: fetchAdmin,
        staleTime: 1000 * 60 * 5,
        retry: 1,
        
    });

    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !admin) {
            router.push("/");
        }
    }, [admin, isLoading, isError]);

    return { admin, isLoading, isError, refetch };
};

export default useAdmin;