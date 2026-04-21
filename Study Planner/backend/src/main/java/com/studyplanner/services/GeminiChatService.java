package com.studyplanner.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.studyplanner.models.ChatMessage;
import com.studyplanner.models.ChatRole;
import com.studyplanner.dto.ChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Comparator;

@Service
@Slf4j
public class GeminiChatService {

	private final RestClient restClient;

	@Value("${app.gemini.apiKey:}")
	private String apiKey;

	@Value("${app.gemini.model:gemini-flash-latest}")
	private String model;

	@Value("${app.gemini.maxTokens:1024}")
	private int maxTokens;

	public GeminiChatService() {
		// Keep it simple and predictable: fixed timeouts so chat can't hang forever.
		var factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(10_000);
		factory.setReadTimeout(45_000);

		this.restClient = RestClient.builder()
				.requestFactory(factory)
				.build();
	}

	public boolean isConfigured() {
		return apiKey != null && !apiKey.isBlank();
	}

	public ChatResponse ask(String userMessage, String context, List<ChatMessage> history) {
		if (!isConfigured()) {
			return new ChatResponse("__GEMINI_FALLBACK__");
		}

		String systemText =
				"You are a helpful study coach chatbot inside a Study Planner web app. " +
				"Be concise, practical, and friendly. If the question is general (e.g. definitions), answer clearly. " +
				"If the question is about studying, provide actionable steps.\n\n" +
				"User context:\n" + (context == null ? "" : context);

		List<Map<String, Object>> contents = new ArrayList<>();
		if (history != null && !history.isEmpty()) {
			history.stream()
					.sorted(Comparator.comparing(ChatMessage::getCreatedAt))
					.skip(Math.max(0, history.size() - 10))
					.forEach(msg -> contents.add(Map.of(
							"role", msg.getRole() == ChatRole.USER ? "user" : "model",
							"parts", List.of(Map.of("text", msg.getContent() == null ? "" : msg.getContent()))
					)));
		}
		contents.add(Map.of(
				"role", "user",
				"parts", List.of(Map.of("text", userMessage == null ? "" : userMessage))
		));

		int outputTokens = pickOutputTokens(userMessage);
		var payload = Map.of(
				"systemInstruction", Map.of(
						"parts", List.of(Map.of("text", systemText))
				),
				"contents", contents,
				"generationConfig", Map.of(
						"maxOutputTokens", outputTokens
				)
		);

		AskResult result = askWithModel(model, payload);
		if (result.response == null) {
			return new ChatResponse("__GEMINI_FALLBACK__:" + result.reason);
		}

		String text = extractText(result.response);
		if (text == null || text.isBlank()) {
			text = "I couldn't generate a response. Please try again.";
		}
		return new ChatResponse(text.trim());
	}

	private AskResult askWithModel(String modelName, Map<String, Object> payload) {
		String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";
		try {
			GeminiGenerateContentResponse body = restClient.post()
					.uri(url + "?key={key}", apiKey)
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(GeminiGenerateContentResponse.class);
			return new AskResult(body, "OK");
		} catch (HttpClientErrorException ex) {
			log.warn("Gemini request failed for model {}. status={}, body={}",
					modelName,
					ex.getStatusCode(),
					ex.getResponseBodyAsString());
			return new AskResult(null, String.valueOf(ex.getStatusCode().value()));
		} catch (ResourceAccessException ex) {
			// Typically a timeout or connection issue.
			log.warn("Gemini request timed out for model {}: {}", modelName, ex.getMessage());
			return new AskResult(null, "TIMEOUT");
		} catch (Exception ex) {
			log.warn("Gemini request failed for model {}: {}", modelName, ex.getMessage());
			return new AskResult(null, "ERROR");
		}
	}

	private String extractText(GeminiGenerateContentResponse response) {
		if (response == null || response.candidates == null || response.candidates.isEmpty()) return null;
		var cand = response.candidates.get(0);
		if (cand == null || cand.content == null || cand.content.parts == null) return null;
		return cand.content.parts.stream()
				.map(p -> p == null ? null : p.text)
				.filter(t -> t != null && !t.isBlank())
				.findFirst()
				.orElse(null);
	}

	private int pickOutputTokens(String userMessage) {
		// Shorter outputs are noticeably faster for typical UI chat queries.
		// Keep a sensible upper bound from config.
		int configured = Math.max(64, maxTokens);
		int len = userMessage == null ? 0 : userMessage.trim().length();
		if (len <= 80) return Math.min(configured, 256);
		if (len <= 200) return Math.min(configured, 512);
		return configured;
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record GeminiGenerateContentResponse(List<Candidate> candidates) {
		@JsonIgnoreProperties(ignoreUnknown = true)
		public record Candidate(Content content) {
		}

		@JsonIgnoreProperties(ignoreUnknown = true)
		public record Content(List<Part> parts) {
		}

		@JsonIgnoreProperties(ignoreUnknown = true)
		public record Part(String text) {
		}
	}

	private record AskResult(GeminiGenerateContentResponse response, String reason) {
	}
}

