package com.studyplanner.repositories;

import com.studyplanner.models.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	@Query("SELECT cm FROM ChatMessage cm WHERE cm.user.id = :userId ORDER BY cm.createdAt ASC")
	List<ChatMessage> findAllByUserIdOrderByCreatedAtAsc(@Param("userId") Long userId);

	@Query("SELECT cm FROM ChatMessage cm WHERE cm.user.id = :userId ORDER BY cm.createdAt DESC")
	List<ChatMessage> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
}

