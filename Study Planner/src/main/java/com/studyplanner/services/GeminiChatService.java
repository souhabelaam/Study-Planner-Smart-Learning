package com.studyplanner.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.studyplanner.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiChatService {

	private final RestClient restClient = RestClient.create();

	@Value("${app.gemini.apiKey:}")
	private String apiKey;

	@Value("${app.gemini.model:gemini-2.0-flash}")
	private String model;

	public boolean isConfigured() {
		return apiKey != null && !apiKey.isBlank();
	}

	public ChatResponse ask(String userMessage, String context) {
		if (!isConfigured()) {
			return new ChatResponse("__GEMINI_FALLBACK__");
		}

		String systemText =
				"You are a helpful study coach chatbot inside a Study Planner web app. " +
				"Be concise, practical, and friendly. If the question is general (e.g. definitions), answer clearly. " +
				"If the question is about studying, provide actionable steps.\n\n" +
				"User context:\n" + (context == null ? "" : context);

		var payload = Map.of(
				"systemInstruction", Map.of(
						"parts", List.of(Map.of("text", systemText))
				),
				"contents", List.of(
						Map.of(
								"role", "user",
								"parts", List.of(Map.of("text", userMessage == null ? "" : userMessage))
						)
				)
		);

		String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";

		GeminiGenerateContentResponse response;
		try {
			response = restClient.post()
					.uri(url + "?key={key}", apiKey)
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(GeminiGenerateContentResponse.class);
		} catch (HttpClientErrorException.TooManyRequests ex) {
			return new ChatResponse("__GEMINI_FALLBACK__");
		} catch (HttpClientErrorException ex) {
			return new ChatResponse("__GEMINI_FALLBACK__");
		} catch (Exception ex) {
			return new ChatResponse("__GEMINI_FALLBACK__");
		}

		String text = extractText(response);
		if (text == null || text.isBlank()) {
			text = "I couldn't generate a response. Please try again.";
		}
		return new ChatResponse(text.trim());
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
}

