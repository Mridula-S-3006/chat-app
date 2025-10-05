package com.example.chatapp.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

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

        if (request.getDisplayName() == null || request.getDisplayName().isEmpty()) {
            request.setDisplayName(request.getName());
        } 

        userRepository.save(request);
        return ResponseEntity.ok("Signup successful");
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User request, HttpSession session) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

        // Store logged-in username in session
        User user = userOpt.get();
        session.setAttribute("username", user.getUsername());

        return ResponseEntity.ok("Login successful");
    }

    // Endpoint to get current logged-in user
    @GetMapping("/current-user")
    public ResponseEntity<Map<String, String>> getCurrentUser(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }

        Map<String, String> response = new HashMap<>();
        response.put("username", username);
        return ResponseEntity.ok(response);
    }
}
