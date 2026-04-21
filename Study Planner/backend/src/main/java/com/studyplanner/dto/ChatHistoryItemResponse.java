package com.studyplanner.dto;

import com.studyplanner.models.ChatRole;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ChatHistoryItemResponse {
	private Long id;
	private ChatRole role;
	private String content;
	private LocalDateTime createdAt;
}

