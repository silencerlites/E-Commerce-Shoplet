import { PickerProps } from "emoji-picker-react";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Send, ImageIcon, Smile } from "lucide-react";

const EmojiPicker = dynamic(
  () =>
    import("emoji-picker-react").then(
      (mod) => mod.default as React.FC<PickerProps>
    ),
  { ssr: false }
);

const ChatInput = ({
  onSendMessage,
  message,
  setMessage,
}: {
  onSendMessage: (e: any) => void;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // replace with real upload logic if you want
      console.log("Uploading image", file.name);
    }
  };

  return (
    <form
      onSubmit={onSendMessage}
      className="flex items-center gap-3 w-full"
    >
      <div className="flex items-center gap-2">
        <label className="cursor-pointer p-2 hover:bg-[#0f1113] rounded-md">
          <ImageIcon className="w-5 h-5 text-gray-300" />
          <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji((p) => !p)}
            className="p-2 hover:bg-[#0f1113] rounded-md"
          >
            <Smile className="w-5 h-5 text-gray-300" />
          </button>

          {showEmoji && (
            <div className="absolute -bottom-[420px] left-0 z-50">
              <div className="w-[300px] overflow-hidden rounded-lg shadow-lg border bg-white">
                <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="w-full bg-[#0f1113] text-sm placeholder-gray-400 py-3 px-4 rounded-lg border border-[#16161a] focus:outline-none"
        />
      </div>

      <div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 transition text-white p-3 rounded-full"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
