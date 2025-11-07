"use client";
import React, { useState, useRef, useEffect } from "react";
import { IoClose, IoSend } from "react-icons/io5";
import { BiBot } from "react-icons/bi";
import { FaUser } from "react-icons/fa";
import { MdHistory, MdDelete } from "react-icons/md";
import {
  CHATBOT_CONFIG,
  sendChatMessage,
  getChatHistory,
  deleteChatHistory,
} from "@/app/lib/chatbotApi";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  apiEndpoint?: string;
  userId?: string;
}

const ChatBot = ({ isOpen, onClose, apiEndpoint, userId }: ChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: CHATBOT_CONFIG.welcomeMessage,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsLoggedIn(!!(user.token || token));
        } catch (e) {
          setIsLoggedIn(!!token);
        }
      } else {
        setIsLoggedIn(!!token);
      }
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component opens
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const result = await getChatHistory();
      if (result.success && result.data && result.data.length > 0) {
        const historyMessages: Message[] = result.data.flatMap((item: any) => [
          {
            id: `hist-user-${item.id}`,
            text: item.message,
            sender: "user" as const,
            timestamp: new Date(item.timestamp),
          },
          {
            id: `hist-bot-${item.id}`,
            text: item.response,
            sender: "bot" as const,
            timestamp: new Date(item.timestamp),
          },
        ]);

        // Only show last 5 conversations (10 messages)
        const recentHistory = historyMessages.slice(-10);
        setMessages([
          {
            id: "1",
            text: CHATBOT_CONFIG.welcomeMessage,
            sender: "bot",
            timestamp: new Date(),
          },
          ...recentHistory,
        ]);
      }
    } catch (error) {
      console.warn(
        "Could not load chat history - backend may not be ready:",
        error
      );
      // Continue with welcome message only
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      const result = await deleteChatHistory();
      if (result.success) {
        setMessages([
          {
            id: "1",
            text: CHATBOT_CONFIG.welcomeMessage,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        alert("Chat history cleared successfully!");
      } else {
        alert(result.message || "Failed to clear history");
      }
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    // Clear any previous errors
    setError(null);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    try {
      // Send to backend and get response
      const result = await sendChatMessage(messageToSend, userId);

      setIsTyping(false);

      if (result.success) {
        // Add bot response
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.message,
          sender: "bot",
          timestamp: result.timestamp ? new Date(result.timestamp) : new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Show error message
        setError(result.message);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text:
            result.message ||
            "Sorry, I couldn't process your request. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      setIsTyping(false);
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, the chatbot service is currently unavailable. Please make sure the backend is running and try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = CHATBOT_CONFIG.quickActions;

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 animate-slideUp">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full">
            <BiBot className="text-2xl text-blue-900" />
          </div>
          <div>
            <h3 className="font-bold text-lg">ASMS Assistant</h3>
            <p className="text-xs text-blue-100">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="hover:bg-blue-800 p-2 rounded-full transition-colors"
            title="Clear History"
          >
            <MdDelete className="text-xl" />
          </button>
          <button
            onClick={onClose}
            className="hover:bg-blue-800 p-2 rounded-full transition-colors"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${
              message.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === "user" ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              {message.sender === "user" ? (
                <FaUser className="text-white text-sm" />
              ) : (
                <BiBot className="text-gray-700 text-lg" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white text-gray-800 rounded-tl-none shadow"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <BiBot className="text-gray-700 text-lg" />
            </div>
            <div className="bg-white rounded-lg rounded-tl-none p-3 shadow">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {isLoggedIn && (
        <div className="px-4 py-2 bg-white border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
                disabled={isTyping}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        {!isLoggedIn ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-600 mb-2">
              Please log in to use the chatbot
            </p>
            <button
              onClick={() => (window.location.href = "/signin")}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors text-sm"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={inputMessage.trim() === "" || isTyping}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <IoSend className="text-lg" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
