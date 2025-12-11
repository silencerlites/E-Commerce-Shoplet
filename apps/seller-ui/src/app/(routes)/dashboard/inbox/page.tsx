"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import ChatInput from "apps/seller-ui/src/shared/components/chats/chatInput";
import useSeller from "apps/seller-ui/src/hooks/useSeller";
import { useWebSocket } from "apps/seller-ui/src/context/web-socket-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";



const ChatPage = () => {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const messageContainer = useRef<HTMLDivElement | null>(null);
  const { seller, isLoading: userLoading } = useSeller();

  const conversationId = searchParams.get("conversationId");
  const { ws } = useWebSocket();

  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  // Messages for the active conversation
  const {
    data: messages = [],
    // refetch: refetchMessages,
    // isFetching: messagesLoading,
  } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId || hasFetchedOnce) return [];
      const res = await axiosInstance.get(`/chatting/api/get-seller-messages/${conversationId}?page=1`);
      setHasFetchedOnce(true);
      return res.data.messages.reverse();
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,
  });



  // auto-scroll when messages change
  useEffect(() => {
    if (!conversationId || !messages || messages.length === 0) return;
    const t = setTimeout(scrollToBottom, 120);
    return () => clearTimeout(t);
  }, [conversationId, messages.length]);

  // scroll helper
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const container = messageContainer.current;
        if (container) container.scrollTop = container.scrollHeight;
      }, 50);
    });
  };

  // Conversations (single source)
  const { data: conversations = [], isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/chatting/api/get-seller-conversations`);
      return res.data?.conversations || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (conversations && conversations.length !== chats.length) {
      setChats(conversations);
    }
  }, [conversations]);


  useEffect(() => {
    if (conversationId && chats.length > 0) {
      const chat = chats.find((c) => c.conversationId === conversationId);
      setSelectedChat(chat || null);
    };
  }, [conversationId, chats]);

  // websocket updates: update react-query caches
  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event: any) => {
      const data = JSON.parse(event.data);

      // Handle new incoming message
      if (data.type === "NEW_MESSAGE") {
        const newMsg = data.payload;

        // Append to messages cache if open conversation matches
        if (newMsg.conversationId === conversationId) {
          queryClient.setQueryData(["messages", conversationId], (old: any = []) => [
            ...(old || []),
            {
              content: newMsg.messageBody || newMsg.content || "",
              senderType: newMsg.senderType,
              createdAt: newMsg.createdAt || new Date().toISOString(),
              seen: false,
            },
          ]);
          scrollToBottom();
        }

        // Update last message and unread count in chat list
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat.conversationId === newMsg.conversationId) {
              const isActiveChat = newMsg.conversationId === conversationId;
              return {
                ...chat,
                lastMessage: newMsg.content || newMsg.messageBody,
                unreadCount: isActiveChat
                  ? 0
                  : (chat.unreadCount || 0) + 1, // increment unread for inactive chat
              };
            }
            return chat;
          })
        );
      }

      // Handle unseen count updates explicitly from server
      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId: updatedId, count } = data.payload;
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.conversationId === updatedId
              ? { ...chat, unreadCount: count }
              : chat
          )
        );
      }
    };
  }, [ws, conversationId, queryClient]);


  // select chat: clear unread locally, mark seen on server, navigate
  const handleChatSelect = (chat: any) => {
    setHasFetchedOnce(false);
    setChats((prev) => prev.map((c) => (c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c)));

    // navigate
    router.push(`?conversationId=${chat.conversationId}`);

    // inform server via ws
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "MARK_AS_SEEN", conversationId: chat.conversationId }));
    }
  };

  // send message
  const handleSend = (e?: any) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat || !ws || ws.readyState !== WebSocket.OPEN) return;

    const payload = {
      fromUserId: seller?.id,
      toUserId: selectedChat.user.id,
      messageBody: message,
      conversationId: selectedChat?.conversationId,
      senderType: "seller",
    };

    // send via WS
    ws.send(JSON.stringify(payload));

    // optimistic UI: append message locally

    // queryClient.setQueryData(["messages", selectedChat.conversationId], (old: any = []) => [
    //   ...(old || []),
    //   {
    //     content: message,
    //     senderType: "seller",
    //     createdAt: new Date().toISOString(),
    //     seen: false,
    //   },
    // ]);

    setMessage("");
    scrollToBottom();
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="w-full h-screen flex bg-[#0b0d10] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[320px] bg-[#0b0d10] border-r border-[#16161a] flex flex-col">
        <div className="p-4 border-b border-[#16161a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <Image
                src={"/mnt/data/a1144c22-b57f-48a4-bd73-03e32fd20e53.png"}
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            </div>
            <div className="text-lg font-semibold">Messages</div>
          </div>
        </div>

        <div className="p-3 border-b border-[#16161a]">
          <input
            placeholder="Search..."
            className="w-full bg-[#0f1113] placeholder-gray-400 text-sm py-2 px-3 rounded-md border border-[#16161a] focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="text-center py-5 text-sm text-gray-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">No conversation available yet!</div>
          ) :

            chats.map((chat) => {
              const isActive = selectedChat?.conversationId === chat.conversationId;
              return (
                <button
                  key={chat.conversationId}
                  onClick={() => handleChatSelect(chat)}
                  className={`w-full text-left px-4 py-3 transition ${isActive ? "bg-blue-950" : "hover:bg-gray-800"}`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={chat.user?.avatar?.[0]?.url || "/default-avatar.png"}
                      alt={chat.user?.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full border w-[40px] h-[40px] object-cover"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-semibold">{chat.user?.name}</span>
                        {chat.user?.isOnline && <span className="w-2 h-2 rounded-full bg-green-500" />}
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-[170px]">{chat.lastMessage || ""}{" "}</p>
                      {chat?.unreadCount > 0 && (
                        <span className="ml-2 text-[10px] bg-blue-600 text-white py-1 px-2 rounded">
                          {chat?.unreadCount > 9 ? "9+" : chat?.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          }
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-[#16161a] bg-[#0b0d10] flex items-center gap-3">
              <Image
                src={selectedChat.user?.avatar?.[0]?.url || "/default-avatar.png"}
                alt={selectedChat.user?.name || "User"}
                width={40}
                height={40}
                className="rounded-full object-cover border border-[#111318]"
              />
              <div>
                <div className="text-white font-semibold">{selectedChat.user?.name}</div>
                <div className="text-xs text-gray-400">{selectedChat.user?.isOnline ? "Online" : "Offline"}</div>
              </div>
            </div>

            <div
              ref={messageContainer}
              className="flex-1 overflow-y-auto px-8 py-6 bg-[#07080a] text-sm"
              style={{ minHeight: 0 }}
            >

              {messages.map((msg: any, idx: number) => {
                const isSeller = String(msg.senderType).toLowerCase() === "seller";
                return (
                  <div key={idx} className={`flex w-full ${isSeller ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[60%] ${isSeller ? "text-right" : "text-left"}`}>
                      <div
                        className={`inline-block px-4 py-2 rounded-md shadow-sm break-words ${isSeller ? "bg-blue-500 text-white" : "bg-[#2b2f33] text-gray-200"
                          }`}
                      >
                        {msg.content}
                      </div>
                      <div
                        className={`text-[11px] text-gray-400 mt-2 ${isSeller ? "mr-1 text-right" : "ml-1 text-left"}`}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* input region — keep dark background to match screenshot */}
            <div className="bg-[#0b0d10] border-t border-[#16161a] p-3">
              <ChatInput message={message} setMessage={setMessage} onSendMessage={handleSend} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-[#07080a]">
            Select a Conversation to start chatting
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
