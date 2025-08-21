package com.example.chatapp.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public User signup(User user) throws Exception {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new Exception("Email already registered");
        }
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new Exception("Username already taken");
        }
        return userRepository.save(user);
    }

    public User login(String email, String password) throws Exception {
        Optional<User> opt = userRepository.findByEmail(email);
        if (opt.isEmpty()) throw new Exception("Email not found");
        User user = opt.get();
        if (!user.getPassword().equals(password)) throw new Exception("Invalid password");
        return user;
    }
}
