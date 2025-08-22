package com.example.chatapp.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.chatapp.model.Message;
import com.example.chatapp.service.MessageService;

// Payload we'll accept from the browser
class SendMessagePayload {
    public String sender;     // sender username
    public String content;    // message text
    // recipient is taken from the {recipient} path variable
}

@Controller
public class ChatWsController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    public ChatWsController(SimpMessagingTemplate messagingTemplate, MessageService messageService) {
        this.messagingTemplate = messagingTemplate;
        this.messageService = messageService;
    }

    // Client sends to: /app/chat/{recipientUsername}
    @MessageMapping("/chat/{recipient}")
    public void sendToUser(@DestinationVariable("recipient") String recipientUsername,
                           SendMessagePayload payload) {

        // Persist the message
        Message saved = messageService.saveMessage(payload.sender, recipientUsername, payload.content);

        // Broadcast to BOTH users' topics so both UIs update instantly
        // Client subscriptions:
        //   /topic/messages/{me}.{other}
        String toRecipientTopic = "/topic/messages/" + recipientUsername + "." + payload.sender;
        String toSenderTopic    = "/topic/messages/" + payload.sender + "." + recipientUsername;

        messagingTemplate.convertAndSend(toRecipientTopic, saved);
        messagingTemplate.convertAndSend(toSenderTopic, saved);
    }
}
