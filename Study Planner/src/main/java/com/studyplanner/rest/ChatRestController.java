package com.studyplanner.rest;

import com.studyplanner.dto.ChatRequest;
import com.studyplanner.dto.ChatResponse;
import com.studyplanner.services.GeminiChatService;
import com.studyplanner.services.StatsService;
import com.studyplanner.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

	private final UserService userService;
	private final StatsService statsService;
	private final GeminiChatService geminiChatService;

	@PostMapping
	public ChatResponse chat(@Valid @RequestBody ChatRequest req) {
		var user = userService.getCurrentUser();
		var report = statsService.buildAiReport(user);

		String rawMessage = req.getMessage() == null ? "" : req.getMessage().trim();
		String context = "AI report: productivityScore=" + report.getProductivityScore()
				+ ", consistencyScore=" + report.getConsistencyScore()
				+ ", mostActiveHour=" + report.getMostActiveHour()
				+ ", suggestions=" + (report.getSuggestions() == null ? "[]" : report.getSuggestions().toString());

		if (!geminiChatService.isConfigured()) {
			return new ChatResponse("Gemini is not configured yet. Set GEMINI_API_KEY in the .env file at the project root, then restart the app.");
		}

		// Prefer Gemini for general questions (e.g. "what is machine learning?")
		ChatResponse gemini = geminiChatService.ask(rawMessage, context);
		if (gemini != null
				&& gemini.getReply() != null
				&& !gemini.getReply().isBlank()
				&& !gemini.getReply().startsWith("__GEMINI_FALLBACK__")) {
			return gemini;
		}
		return new ChatResponse("Gemini is temporarily unavailable. Please try again in a moment.");
	}
}

