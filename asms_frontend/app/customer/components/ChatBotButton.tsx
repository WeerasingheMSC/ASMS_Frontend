"use client";
import React, { useState } from "react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import ChatBot from "./ChatBot";

interface ChatBotButtonProps {
  apiEndpoint?: string;
  userId?: string;
}

const ChatBotButton = ({ apiEndpoint, userId }: ChatBotButtonProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setHasNewMessage(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-900 to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50 group"
          aria-label="Open chatbot"
        >
          <IoChatbubbleEllipsesOutline className="text-3xl" />

          {/* Notification Badge */}
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              1
            </span>
          )}

          {/* Tooltip */}
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat with us
          </span>

          {/* Pulse Animation Ring */}
          <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75"></span>
        </button>
      )}

      {/* ChatBot Component */}
      <ChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        apiEndpoint={apiEndpoint}
        userId={userId}
      />
    </>
  );
};

export default ChatBotButton;
