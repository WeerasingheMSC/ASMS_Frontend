package com.asms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatbotController {

    // Simple in-memory storage (replace with database in production)
    private Map<Integer, List<ChatHistory>> chatHistoryMap = new HashMap<>();

    /**
     * POST /api/chatbot/chat - Send a message and get a response
     * 
     * Request body:
     * {
     *   "message": "Hello",
     *   "userId": 1
     * }
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest request,
                                   @RequestHeader("Authorization") String authHeader) {
        try {
            String userMessage = request.getMessage();
            Integer userId = request.getUserId();

            // Simple chatbot logic (replace with your AI/ML service)
            String botResponse = generateResponse(userMessage);

            // Save to history
            ChatHistory history = new ChatHistory();
            history.setId(generateId());
            history.setMessage(userMessage);
            history.setResponse(botResponse);
            history.setTimestamp(new Date());
            history.setUserId(userId);

            chatHistoryMap.computeIfAbsent(userId, k -> new ArrayList<>()).add(history);

            // Return response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", botResponse);
            response.put("timestamp", history.getTimestamp());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error processing your message: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * GET /api/chatbot/history - Get chat history for logged-in user
     */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract userId from token (you'll need to implement this based on your JWT setup)
            Integer userId = extractUserIdFromToken(authHeader);

            List<ChatHistory> history = chatHistoryMap.getOrDefault(userId, new ArrayList<>());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching history: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * DELETE /api/chatbot/history - Clear chat history
     */
    @DeleteMapping("/history")
    public ResponseEntity<?> clearHistory(@RequestHeader("Authorization") String authHeader) {
        try {
            Integer userId = extractUserIdFromToken(authHeader);
            chatHistoryMap.remove(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Chat history cleared successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error clearing history: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // Helper method to generate chatbot response
    private String generateResponse(String userMessage) {
        String message = userMessage.toLowerCase();

        // Service-related responses
        if (message.contains("service") || message.contains("appointment")) {
            return "I can help you with our services! We offer vehicle maintenance, repairs, and inspections. Would you like to book an appointment?";
        } else if (message.contains("price") || message.contains("cost")) {
            return "Our pricing varies based on the service. Please select a service from the booking wizard to see detailed pricing.";
        } else if (message.contains("hours") || message.contains("open")) {
            return "We're open Monday-Friday: 8AM-6PM, Saturday: 9AM-4PM, and closed on Sundays.";
        } else if (message.contains("location") || message.contains("where")) {
            return "We're located at 123 Main Street. You can find directions in our contact section.";
        } else if (message.contains("cancel") || message.contains("reschedule")) {
            return "You can manage your appointments from the 'My Appointments' page. Need help with a specific appointment?";
        } else if (message.contains("hello") || message.contains("hi")) {
            return "Hello! How can I assist you with your vehicle service needs today?";
        } else if (message.contains("thank")) {
            return "You're welcome! Feel free to ask if you need anything else.";
        } else {
            return "I'm here to help! You can ask me about services, appointments, pricing, or hours. What would you like to know?";
        }
    }

    // Helper method to extract user ID from JWT token
    private Integer extractUserIdFromToken(String authHeader) {
        // TODO: Implement JWT token parsing to extract userId
        // For now, return a default value
        // You should use your existing JWT utility class here
        
        // Example:
        // String token = authHeader.replace("Bearer ", "");
        // return jwtUtil.getUserIdFromToken(token);
        
        return 1; // Replace with actual implementation
    }

    // Helper method to generate unique ID
    private int idCounter = 1;
    private int generateId() {
        return idCounter++;
    }

    // Request/Response classes
    static class ChatRequest {
        private String message;
        private Integer userId;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public Integer getUserId() { return userId; }
        public void setUserId(Integer userId) { this.userId = userId; }
    }

    static class ChatHistory {
        private Integer id;
        private String message;
        private String response;
        private Date timestamp;
        private Integer userId;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getResponse() { return response; }
        public void setResponse(String response) { this.response = response; }
        public Date getTimestamp() { return timestamp; }
        public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
        public Integer getUserId() { return userId; }
        public void setUserId(Integer userId) { this.userId = userId; }
    }
}
