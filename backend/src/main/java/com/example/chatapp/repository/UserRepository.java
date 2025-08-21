package com.example.chatapp.repository;

import java.util.Optional;

import com.example.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    
    // Changed to return Optional<User> instead of User
    Optional<User> findByEmail(String email);
    
    // Added missing method that returns Optional<User>
    Optional<User> findByUsername(String username);
}