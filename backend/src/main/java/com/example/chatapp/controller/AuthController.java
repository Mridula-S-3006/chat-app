package com.example.chatapp.controller;

import java.util.Optional;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Allow requests from frontend
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // Signup
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody User request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already exists");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
        }

        // Set displayName to name if not provided - THIS IS THE KEY FIX!
        if (request.getDisplayName() == null || request.getDisplayName().isEmpty()) {
            request.setDisplayName(request.getName());
        }

        userRepository.save(request);
        return ResponseEntity.ok("Signup successful");
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User request) {
        // Fixed: Handle Optional<User> properly
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
        User user = userOpt.get();
        return ResponseEntity.ok("Login successful: " + user.getUsername());
    }
}