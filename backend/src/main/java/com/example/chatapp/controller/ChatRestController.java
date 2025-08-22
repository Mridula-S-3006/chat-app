package com.example.chatapp.controller;

import com.example.chatapp.model.Message;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;
import com.example.chatapp.service.MessageService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ChatRestController {

    private final UserRepository userRepository;
    private final MessageService messageService;

    public ChatRestController(UserRepository userRepository, MessageService messageService) {
        this.userRepository = userRepository;
        this.messageService = messageService;
    }

    // Search users for the sidebar suggestions:
    // GET /users?query=ali
    @GetMapping("/users")
    public List<User> searchUsers(@RequestParam("query") String query) {
        // Requires: UserRepository#findByUsernameContainingIgnoreCase
        return userRepository.findByUsernameContainingIgnoreCase(query);
    }

    // Chat history for the right panel:
    // GET /messages/alice/bob
    @GetMapping("/messages/{user1}/{user2}")
    public List<Message> getConversation(@PathVariable String user1, @PathVariable String user2) {
        return messageService.getConversation(user1, user2);
    }
}
