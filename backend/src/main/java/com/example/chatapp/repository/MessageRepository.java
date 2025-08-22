package com.example.chatapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.chatapp.model.Message;
import com.example.chatapp.model.User;

public interface MessageRepository extends JpaRepository<Message, Integer> {

    @Query("""
           SELECT m FROM Message m
           WHERE (m.sender = :u1 AND m.receiver = :u2)
              OR (m.sender = :u2 AND m.receiver = :u1)
           ORDER BY m.sentAt ASC
           """)
    List<Message> getConversation(@Param("u1") User u1, @Param("u2") User u2);
}
