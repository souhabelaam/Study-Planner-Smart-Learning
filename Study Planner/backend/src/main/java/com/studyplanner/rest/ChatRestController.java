package com.studyplanner.rest;

import com.studyplanner.dto.ChatRequest;
import com.studyplanner.dto.ChatHistoryItemResponse;
import com.studyplanner.dto.ChatResponse;
import com.studyplanner.models.ChatMessage;
import com.studyplanner.models.ChatRole;
import com.studyplanner.repositories.ChatMessageRepository;
import com.studyplanner.services.ChatRateLimiterService;
import com.studyplanner.services.GeminiChatService;
import com.studyplanner.services.StatsService;
import com.studyplanner.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

	private final UserService userService;
	private final StatsService statsService;
	private final GeminiChatService geminiChatService;
	private final ChatMessageRepository chatMessageRepository;
	private final ChatRateLimiterService chatRateLimiterService;

	@PostMapping
	public ChatResponse chat(@Valid @RequestBody ChatRequest req) {
		var user = userService.getCurrentUser();
		if (!chatRateLimiterService.tryConsume(user.getId())) {
			throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many chat requests. Please retry in a minute.");
		}
		var report = statsService.buildAiReport(user);

		String rawMessage = req.getMessage() == null ? "" : req.getMessage().trim();
		if (rawMessage.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be blank.");
		}
		String sanitized = sanitize(rawMessage);
		chatMessageRepository.save(ChatMessage.builder()
				.user(user)
				.role(ChatRole.USER)
				.content(sanitized)
				.build());

		// Fetch the latest N messages efficiently (DESC + limit), then reverse for chronological order.
		List<ChatMessage> history = chatMessageRepository.findByUserIdOrderByCreatedAtDesc(
				user.getId(),
				org.springframework.data.domain.PageRequest.of(0, 20)
		);
		Collections.reverse(history);

		String context = "AI report: productivityScore=" + report.getProductivityScore()
				+ ", consistencyScore=" + report.getConsistencyScore()
				+ ", mostActiveHour=" + report.getMostActiveHour()
				+ ", suggestions=" + (report.getSuggestions() == null ? "[]" : report.getSuggestions().toString());

		if (!geminiChatService.isConfigured()) {
			return new ChatResponse("Gemini is not configured yet. Set GEMINI_API_KEY in the .env file at the project root, then restart the app.");
		}

		// Prefer Gemini for general questions (e.g. "what is machine learning?")
		ChatResponse gemini = geminiChatService.ask(sanitized, context, history);
		if (gemini != null
				&& gemini.getReply() != null
				&& !gemini.getReply().isBlank()
				&& !gemini.getReply().startsWith("__GEMINI_FALLBACK__")) {
			chatMessageRepository.save(ChatMessage.builder()
					.user(user)
					.role(ChatRole.ASSISTANT)
					.content(gemini.getReply().trim())
					.build());
			return gemini;
		}

		String reply = gemini == null ? "" : gemini.getReply();
		if (reply.startsWith("__GEMINI_FALLBACK__:429")) {
			return new ChatResponse("Gemini rate limit/quota reached. Please wait a bit and try again.");
		}
		if (reply.startsWith("__GEMINI_FALLBACK__:401") || reply.startsWith("__GEMINI_FALLBACK__:403")) {
			return new ChatResponse("Gemini API key is invalid or missing permissions. Re-check `GEMINI_API_KEY` in your `.env` and restart.");
		}
		if (reply.startsWith("__GEMINI_FALLBACK__:TIMEOUT")) {
			return new ChatResponse("Gemini took too long to respond. Please retry.");
		}
		return new ChatResponse("Gemini is temporarily unavailable. Please try again in a moment.");
	}

	@GetMapping("/history")
	public List<ChatHistoryItemResponse> history() {
		var user = userService.getCurrentUser();
		// Fetch latest 50, but return oldest->newest so UI can render naturally.
		List<ChatMessage> latest = chatMessageRepository.findByUserIdOrderByCreatedAtDesc(
				user.getId(),
				org.springframework.data.domain.PageRequest.of(0, 50)
		);
		Collections.reverse(latest);
		return latest.stream()
				.map(msg -> new ChatHistoryItemResponse(msg.getId(), msg.getRole(), msg.getContent(), msg.getCreatedAt()))
				.toList();
	}

	private String sanitize(String input) {
		String cleaned = input.replaceAll("[<>\"']", "").trim();
		if (cleaned.length() > 2000) {
			return cleaned.substring(0, 2000);
		}
		return cleaned;
	}
}

