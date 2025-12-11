"use client"

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "apps/user-ui/src/context/web-socket-context";
import useRequireAuth from "apps/user-ui/src/hooks/useRequiredAuth";
import ChatInput from "apps/user-ui/src/shared/components/chats/chatInput";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { isProtected } from "apps/user-ui/src/utils/protected";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type Chat = {
  conversationId: string;
  seller?: any;
  lastMessage?: string;
  unreadCount?: number;
  [k: string]: any;
};

const ChatPage: React.FC = () => {
  const searchParams = useSearchParams();
  const { user } = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const conversationId = searchParams.get("conversationId");

  const { ws, unreadCounts } = useWebSocket() || { ws: null, unreadCounts: {} };

  // Conversations
  const { data: conversations, isLoading } = useQuery<Chat[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/chatting/api/get-user-conversations`, isProtected);
      return res.data.conversations || [];
    },
    staleTime: 1000 * 60 * 2,
  });


  useEffect(() => {
    if (conversations) setChats(conversations);
  }, [conversations]);

  // Messages for selected conversation
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["messages", conversationId ?? ""],
    queryFn: async () => {
      if (!conversationId || hasFetchedOnce) return [];
      const res = await axiosInstance.get(`/chatting/api/get-messages/${conversationId}?page=1`, isProtected);
      setPage(1);
      setHasMore(res.data.hasMore);
      setHasFetchedOnce(true);
      return res.data.messages.reverse();
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (conversationId && chats.length > 0) {
      const chat = chats.find((c) => c.conversationId === conversationId) || null;
      setSelectedChat(chat);
    }
  }, [conversationId, chats]);

  // helper to safely send through ws
  const wsSend = (data: any) => {
    try {
      if (!ws) return;
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify(data));
    } catch (e) {
      console.warn("wsSend error", e);
    }
  };

  // WebSocket listener: handle incoming events
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (ev: MessageEvent) => {
      let data: any;
      try {
        data = JSON.parse(ev.data);
      } catch (e) {
        return;
      }

      // NEW_MESSAGE event (from your server)
      if (data.type === "NEW_MESSAGE") {
        const msg = data.payload || data.message || data;

        // derive senderType locally (DB may not store it)
        const senderType = msg.senderId === user?.id ? "user" : "seller";
        msg.senderType = senderType;

        // update messages cache for the specific conversation
        queryClient.setQueryData(
          ["messages", msg.conversationId],
          (old: any = []) => {
            // avoid duplicate by id or timestamp if needed
            return [...old, msg];
          }
        );

        // update last message for only that conversation
        setChats((prev) =>
          prev.map((c) =>
            c.conversationId === msg.conversationId ? { ...c, lastMessage: msg.content } : c
          )
        );

        // if user is currently viewing that conversation, scroll
        if (msg.conversationId === selectedChat?.conversationId) {
          // small timeout to let DOM render
          requestAnimationFrame(() => scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" }));
        }

        return;
      }

      // UNSEEN_COUNT_UPDATE
      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId: cid, count } = data.payload || data;
        setChats((prev) => prev.map((c) => (c.conversationId === cid ? { ...c, unreadCount: count } : c)));
        return;
      }

      // MARK_AS_SEEN ack or MESSAGES_SEEN
      if (data.type === "MESSAGES_SEEN" || data.type === "MARK_AS_SEEN_ACK") {
        const { conversationId: cid } = data.payload || data;
        setChats((prev) => prev.map((c) => (c.conversationId === cid ? { ...c, unreadCount: 0 } : c)));
        return;
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, user?.id, selectedChat, queryClient]);

  // load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!conversationId) return;
    const nextPage = page + 1;
    const res = await axiosInstance.get(`/chatting/api/get-messages/${conversationId}?page=${nextPage}`, isProtected);

    queryClient.setQueriesData(
      { queryKey: ["messages", conversationId] },
      (old: any = []) => [...res.data.messages.reverse(), ...old]
    );

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  const handleChatSelect = (chat: Chat) => {
    setHasFetchedOnce(false);
    setChats((prev) => prev.map((c) => (c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c)));
    router.push(`?conversationId=${chat.conversationId}`);

    wsSend({ type: "MARK_AS_SEEN", conversationId: chat.conversationId });
  };

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;

    const payload = {
      fromUserId: user?.id,
      toUserId: selectedChat?.seller?.id,
      conversationId: selectedChat?.conversationId,
      messageBody: messageText,
      senderType: "user",
    };

    wsSend(payload);

    // update lastMessage only for the selected conversation
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.conversationId === selectedChat.conversationId ? { ...chat, lastMessage: payload.messageBody } : chat
      )
    );

    setMessageText("");

    // scroll after DOM update
    requestAnimationFrame(() => scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const getLastMessage = (chat: Chat) => chat?.lastMessage || "";

  return (
    <div className="w-full">
      <div className="md:w-[80%] mx-auto pt-5">
        <div className="flex h-[80vh] shadow-sm overflow-hidden">
          <div className="w-[320px] border-r border-r-gray=200 bg-gray-50">
            <div className="p-4 border-b border-b-gray-200 text-lg font-semibold text-gray-600">Messages</div>
            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="p-4 text-sm text-gray-500">Loading .....</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No Conversation</div>
              ) : (
                chats.map((chat) => {
                  const isActive = selectedChat?.conversationId === chat.conversationId;
                  return (
                    <button
                      key={chat.conversationId}
                      onClick={() => handleChatSelect(chat)}
                      className={`w-full text-left px-4 py-3 transition hover:bg-blue-50 ${isActive ? "bg-blue-50" : ""}`} 
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={chat.seller?.avatar?.[0]?.url || "/default-avatar.png"}
                          alt={chat.seller?.name || "Shop"}
                          width={40}
                          height={40}
                          className="rounded-full border w-[40px] h-[40px] object-cover"
                        />

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-800 font-semibold">{chat.seller?.name}</span>
                            {chat.seller?.isOnline && <span className="w-2 h-2 rounded-full bg-green-500" />}
                          </div>
                          <p className="text-xs text-gray-500 truncate max-w-[170px]">{getLastMessage(chat)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-col flex-1 bg-gray-100">
            {selectedChat ? (
              <>
                <div className="p-4 border-b border-b-gray-200 bg-white flex items-center gap-3">
                  <Image
                    src={selectedChat.seller?.avatar?.[0]?.url || "/default-avatar.png"}
                    alt={selectedChat?.seller?.name}
                    width={40}
                    height={40}
                    className="rounded-full border w-[40px] h-[40px] object-cover border-gray-200"
                  />
                  <div>
                    <h2 className="text-gray-800 font-semibold text-base">{selectedChat.seller?.name}</h2>
                    <p className="text-xs text-gray-500">{selectedChat.seller?.isOnline ? "Online" : "Offline"}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-sm">
                  {hasMore && (
                    <div className="flex justify-center mb-2">
                      <button onClick={loadMoreMessages} className="text-xs px-4 py-1 bg-gray-200 hover:bg-gray-300">Load previous messages</button>
                    </div>
                  )}

                  {messages?.map((msg: any, index: number) => {
                    const isUserMsg = msg.senderId === user?.id || msg.senderType === "user";
                    return (
                      <div key={index} className={`flex flex-col ${isUserMsg ? "items-end ml-auto" : "items-start"} max-w-[80%]`}>
                        <div className={`${isUserMsg ? "bg-blue-600 text-white" : "bg-gray-200 text-black"} px-4 py-2 rounded-md shadow-sm w-fit`}>
                          {msg.text || msg.content}
                        </div>
                        <div className={`text-[11px] text-gray-400 mt-1 flex items-center ${isUserMsg ? "mr-1 justify-end" : "ml-1"}`}>
                          {msg.time || new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={scrollAnchorRef} />
                </div>

                <ChatInput message={messageText} setMessage={setMessageText} onSendMessage={handleSend} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a Conversation to start chatting</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
