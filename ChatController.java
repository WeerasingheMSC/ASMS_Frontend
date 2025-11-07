/*
 * SPRING BOOT CHATBOT CONTROLLER EXAMPLE
 * 
 * This is an example controller for your Spring Boot backend.
 * Place this in your Spring Boot project.
 * 
 * Package: com.vxservice.controller (or your package structure)
 */

package com.vxservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000") // Allow requests from Next.js frontend
public class ChatController {

    // POST endpoint to handle chat messages
    @PostMapping
    public ResponseEntity<ChatResponse> handleChatMessage(@RequestBody ChatRequest request) {

        String userMessage = request.getMessage();
        String userId = request.getUserId();

        System.out.println("Received message from user " + userId + ": " + userMessage);

        // Process the message and generate a response
        String botResponse = generateBotResponse(userMessage, userId);

        // Create response object
        ChatResponse response = new ChatResponse();
        response.setResponse(botResponse);
        response.setTimestamp(LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    // Simple bot logic - replace with your AI/NLP service
    private String generateBotResponse(String userMessage, String userId) {
        String message = userMessage.toLowerCase();

        // Simple keyword-based responses
        if (message.contains("appointment") && message.contains("book")) {
            return "I can help you book an appointment! What type of service do you need? " +
                    "We offer oil changes, brake services, tire rotations, and more.";
        } else if (message.contains("appointment") && message.contains("check")) {
            return "I'll help you check your appointment status. Could you please provide " +
                    "your appointment ID or registration number?";
        } else if (message.contains("services") || message.contains("service")) {
            return "We offer a wide range of services including:\n" +
                    "• Regular Maintenance (Oil Change, Filter Replacement)\n" +
                    "• Brake Services\n" +
                    "• Tire Services\n" +
                    "• Engine Diagnostics\n" +
                    "• AC Services\n" +
                    "Would you like to know more about any specific service?";
        } else if (message.contains("cancel")) {
            return "I understand you want to cancel an appointment. Please provide your " +
                    "appointment ID, and I'll help you with the cancellation process.";
        } else if (message.contains("reschedule")) {
            return "I can help you reschedule your appointment. Please provide your " +
                    "appointment ID and the new preferred date and time.";
        } else if (message.contains("support") || message.contains("help")) {
            return "I'm here to help! You can:\n" +
                    "• Book a new appointment\n" +
                    "• Check appointment status\n" +
                    "• View our services\n" +
                    "• Reschedule or cancel appointments\n" +
                    "What would you like assistance with?";
        } else if (message.contains("hours") || message.contains("timing")) {
            return "We're open Monday to Saturday, 8:00 AM to 6:00 PM. " +
                    "We're closed on Sundays and public holidays.";
        } else if (message.contains("location") || message.contains("address")) {
            return "We're located at 123 Service Street, City Center. " +
                    "You can find us easily using Google Maps. Would you like directions?";
        } else if (message.contains("price") || message.contains("cost")) {
            return "Our pricing varies by service. Could you let me know which specific " +
                    "service you're interested in? I'll provide you with accurate pricing information.";
        } else if (message.contains("hello") || message.contains("hi")) {
            return "Hello! Welcome to VX Service. How can I assist you today?";
        } else if (message.contains("thank")) {
            return "You're welcome! Is there anything else I can help you with?";
        } else {
            // Default response for unrecognized messages
            return "I understand you said: '" + userMessage + "'. " +
                    "I'm here to help with appointments, services, and general inquiries. " +
                    "Could you please provide more details about what you need?";
        }
    }

    // Inner classes for request/response (or create separate files)
    public static class ChatRequest {
        private String message;
        private String userId;
        private String timestamp;

        // Getters and Setters
        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }

    public static class ChatResponse {
        private String response;
        private String timestamp;

        // Getters and Setters
        public String getResponse() {
            return response;
        }

        public void setResponse(String response) {
            this.response = response;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }
}

/*
 * ALTERNATIVE: If you want to integrate with AI services like OpenAI,
 * Dialogflow, etc.
 * 
 * Add dependencies in pom.xml or build.gradle, then:
 */

/*
 * @Service
 * public class ChatbotService {
 * 
 * // Example: OpenAI Integration
 * 
 * @Autowired
 * private OpenAiService openAiService;
 * 
 * public String processMessage(String message, String userId) {
 * // Call your AI service
 * return openAiService.generateResponse(message);
 * }
 * 
 * // Example: Database Integration
 * 
 * @Autowired
 * private ConversationRepository conversationRepository;
 * 
 * public void saveConversation(String userId, String message, String response)
 * {
 * Conversation conv = new Conversation();
 * conv.setUserId(userId);
 * conv.setUserMessage(message);
 * conv.setBotResponse(response);
 * conv.setTimestamp(LocalDateTime.now());
 * conversationRepository.save(conv);
 * }
 * }
 */

/*
 * CORS Configuration (if @CrossOrigin doesn't work)
 * 
 * Create a separate configuration class:
 */

/*
 * package com.vxservice.config;
 * 
 * import org.springframework.context.annotation.Configuration;
 * import org.springframework.web.servlet.config.annotation.CorsRegistry;
 * import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
 * 
 * @Configuration
 * public class WebConfig implements WebMvcConfigurer {
 * 
 * @Override
 * public void addCorsMappings(CorsRegistry registry) {
 * registry.addMapping("/api/**")
 * .allowedOrigins("http://localhost:3000", "http://localhost:3001")
 * .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
 * .allowedHeaders("*")
 * .allowCredentials(true);
 * }
 * }
 */
