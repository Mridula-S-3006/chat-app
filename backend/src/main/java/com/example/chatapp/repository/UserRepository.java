package com.example.chatapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.chatapp.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // Check for duplicates during signup
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // Login / fetch user by email or username
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    // Search users for sidebar suggestion / typeahead
    List<User> findByUsernameContainingIgnoreCase(String username);
}
