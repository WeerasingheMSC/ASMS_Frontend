"use client";
import React from "react";
import ChatBotButton from "./ChatBotButton";

interface CustomerLayoutWrapperProps {
  children: React.ReactNode;
  chatApiEndpoint?: string;
}

const CustomerLayoutWrapper = ({
  children,
  chatApiEndpoint = process.env.NEXT_PUBLIC_CHATBOT_API ||
    "http://localhost:8080/api/chat",
}: CustomerLayoutWrapperProps) => {
  return (
    <>
      {children}
      <ChatBotButton apiEndpoint={chatApiEndpoint} />
    </>
  );
};

export default CustomerLayoutWrapper;
