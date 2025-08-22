package com.example.chatapp.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.chatapp.model.Message;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.repository.UserRepository;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public Message saveMessage(String senderUsername, String receiverUsername, String text) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found: " + senderUsername));
        User receiver = userRepository.findByUsername(receiverUsername)
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found: " + receiverUsername));

        Message m = new Message();
        m.setSender(sender);
        m.setReceiver(receiver);
        m.setMessageText(text);
        return messageRepository.save(m);
    }

    public List<Message> getConversation(String u1Username, String u2Username) {
        User u1 = userRepository.findByUsername(u1Username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + u1Username));
        User u2 = userRepository.findByUsername(u2Username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + u2Username));

        return messageRepository.getConversation(u1, u2);
    }
}
