/**
 * CHATBOT INTEGRATION EXAMPLES
 *
 * This file shows different ways to integrate the chatbot
 * into your customer pages.
 */

// ============================================
// Example 1: Basic Integration
// ============================================
"use client";
import ChatBotButton from "./components/ChatBotButton";

export default function MyPage() {
  return (
    <div>
      <h1>My Page Content</h1>

      {/* Add chatbot at the end of your page */}
      <ChatBotButton />
    </div>
  );
}

// ============================================
// Example 2: With Custom API Endpoint
// ============================================
("use client");
import ChatBotButton from "./components/ChatBotButton";

export default function MyPage() {
  return (
    <div>
      <h1>My Page Content</h1>

      {/* Use a different API endpoint */}
      <ChatBotButton apiEndpoint="http://your-backend.com/api/custom-chat" />
    </div>
  );
}

// ============================================
// Example 3: With User Authentication
// ============================================
("use client");
import { useEffect, useState } from "react";
import ChatBotButton from "./components/ChatBotButton";

export default function MyPage() {
  const [userId, setUserId] = useState<string>();

  useEffect(() => {
    // Get user ID from your auth system
    // This is just an example - replace with your actual auth logic
    const user = getCurrentUser(); // Your auth function
    setUserId(user?.id);
  }, []);

  return (
    <div>
      <h1>My Page Content</h1>

      {/* Pass user ID for personalized chat */}
      <ChatBotButton userId={userId} />
    </div>
  );
}

// ============================================
// Example 4: Full Page Layout with Sidebar
// ============================================
("use client");
import Sidebar from "./components/Sidebar";
import ChatBotButton from "./components/ChatBotButton";

export default function MyCustomerPage() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar activeItem="MyPage" />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">My Page</h1>

        {/* Your page content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cards, forms, tables, etc. */}
        </div>
      </div>

      {/* Chatbot - will appear as floating button */}
      <ChatBotButton />
    </div>
  );
}

// ============================================
// Example 5: Using Layout Wrapper (Apply to All Pages)
// ============================================

// In app/customer/layout.tsx
("use client");
import CustomerLayoutWrapper from "./components/CustomerLayoutWrapper";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerLayoutWrapper>{children}</CustomerLayoutWrapper>;
}

// Then in any child page (no need to add ChatBotButton manually):
export default function AnyPage() {
  return (
    <div>
      <h1>Any Customer Page</h1>
      {/* Chatbot automatically available! */}
    </div>
  );
}

// ============================================
// Example 6: Conditionally Show Chatbot
// ============================================
("use client");
import { useState } from "react";
import ChatBotButton from "./components/ChatBotButton";

export default function MyPage() {
  const [showChat, setShowChat] = useState(true);

  return (
    <div>
      <h1>My Page Content</h1>

      <button onClick={() => setShowChat(!showChat)}>Toggle Chatbot</button>

      {/* Only show chatbot when showChat is true */}
      {showChat && <ChatBotButton />}
    </div>
  );
}

// ============================================
// Example 7: Direct ChatBot Component Usage
// ============================================
("use client");
import { useState } from "react";
import ChatBot from "./components/ChatBot";

export default function MyPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div>
      <h1>My Page Content</h1>

      {/* Custom button to open chat */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Need Help?
      </button>

      {/* ChatBot component directly */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

// ============================================
// Helper function example (for Example 3)
// ============================================
function getCurrentUser() {
  // Replace with your actual authentication logic
  // Example: return from context, localStorage, or API call
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}
