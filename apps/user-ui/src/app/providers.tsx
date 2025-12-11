"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import axiosInstance from "../utils/axiosInstance";
import { WebSocketProvider } from "../context/web-socket-context";

const Provider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
          },
        },
      })
  );

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch logged-in user ONCE
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/api/logged-in-user");
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {!loadingUser && (
        <>
          {user ? (
            <WebSocketProvider user={user}>{children}</WebSocketProvider>
          ) : (
            children
          )}
        </>
      )}

      <Toaster />
    </QueryClientProvider>
  );
};

export default Provider;
