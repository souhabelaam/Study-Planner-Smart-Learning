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
		String message = rawMessage.toLowerCase();
		String context = "AI report: productivityScore=" + report.getProductivityScore()
				+ ", consistencyScore=" + report.getConsistencyScore()
				+ ", mostActiveHour=" + report.getMostActiveHour()
				+ ", suggestions=" + (report.getSuggestions() == null ? "[]" : report.getSuggestions().toString());

		// Prefer Gemini for general questions (e.g. "what is machine learning?")
		if (geminiChatService.isConfigured()) {
			ChatResponse gemini = geminiChatService.ask(rawMessage, context);
			// If Gemini works, return it. Otherwise, continue with local fallbacks below.
			if (gemini != null
					&& gemini.getReply() != null
					&& !gemini.getReply().isBlank()
					&& !gemini.getReply().startsWith("__GEMINI_FALLBACK__")) {
				return gemini;
			}
		}

		// Fallback when Gemini isn't configured
		if (message.contains("score") || message.contains("productivity")) {
			return new ChatResponse("Your productivity score is " + report.getProductivityScore()
					+ "/10. One quick win: pick a fixed start time for your next session.");
		}
		if (message.contains("suggest") || message.contains("advice") || message.contains("tips")) {
			String reply = report.getSuggestions() == null || report.getSuggestions().isEmpty()
					? "I don't have suggestions yet. Add a few sessions first, then check Analytics."
					: String.join("\n- ", report.getSuggestions().stream().limit(3).toList()).replaceFirst("^", "- ");
			return new ChatResponse(reply);
		}
		if (message.contains("when") || message.contains("hour")) {
			return new ChatResponse("Your most active hour is around " + report.getMostActiveHour()
					+ ":00. Try scheduling your toughest subject near that time.");
		}

		if (message.contains("machine learning")) {
			return new ChatResponse(
					"Machine learning (ML) is a branch of AI where computers learn patterns from data to make predictions or decisions without being explicitly programmed for every rule.\n\n" +
					"Examples:\n" +
					"- Email spam detection\n" +
					"- Recommender systems (YouTube/Netflix)\n" +
					"- Predicting exam score based on study history\n\n" +
					"Want a quick explanation of supervised vs unsupervised learning?"
			);
		}

		// Always-on fallback assistant: answer *any* question in a helpful way,
		// even when Gemini isn't available.
		return new ChatResponse(
				"I can help.\n\n" +
				"Here’s a good way to think about your question:\n" +
				"- Define the key terms you’re asking about\n" +
				"- Give a simple example\n" +
				"- Share 2–3 practical takeaways\n\n" +
				"If you tell me your subject (e.g. math, CS, biology) and your level (high school / university), I’ll tailor the explanation.\n\n" +
				"Also: if you want study tips for this topic, I can suggest a short plan for today."
		);
	}
}

