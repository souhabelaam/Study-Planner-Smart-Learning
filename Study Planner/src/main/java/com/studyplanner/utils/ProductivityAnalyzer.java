package com.studyplanner.utils;

import com.studyplanner.dto.ProductivityReport;
import com.studyplanner.models.StudySession;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.IntSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ProductivityAnalyzer {

	public ProductivityReport analyze(List<StudySession> sessions) {
		if (sessions == null || sessions.isEmpty()) {
			return ProductivityReport.builder()
					.consistencyScore(0)
					.productivityScore(0)
					.mostActiveHour(0)
					.suggestions(List.of("Commencez à enregistrer vos sessions pour générer un rapport."))
					.build();
		}

		IntSummaryStatistics stats = sessions.stream()
				.collect(Collectors.summarizingInt(StudySession::getDurationMinutes));

		double averagePerSession = stats.getAverage();

		Map<LocalDate, List<StudySession>> sessionsByDay = sessions.stream()
				.collect(Collectors.groupingBy(StudySession::getDate));

		double dailyAverage = sessionsByDay.values().stream()
				.mapToInt(list -> list.stream().mapToInt(StudySession::getDurationMinutes).sum())
				.average()
				.orElse(0);

		double variance = sessionsByDay.values().stream()
				.mapToDouble(list -> {
					int sum = list.stream().mapToInt(StudySession::getDurationMinutes).sum();
					double diff = sum - dailyAverage;
					return diff * diff;
				})
				.average()
				.orElse(0);

		double stdDeviation = Math.sqrt(variance);
		double consistencyScore = 10 - Math.min(10, stdDeviation / (dailyAverage == 0 ? 1 : dailyAverage) * 10);
		double productivityScore = Math.min(10, averagePerSession / 30 * 10);

		int mostActiveHour = sessions.stream()
				.filter(session -> session.getStartHour() != null)
				.collect(Collectors.groupingBy(StudySession::getStartHour, Collectors.counting()))
				.entrySet()
				.stream()
				.max(Map.Entry.comparingByValue())
				.map(Map.Entry::getKey)
				.orElse(0);

		List<String> suggestions = new ArrayList<>();
		long sessionsAfter21 = sessions.stream()
				.filter(session -> session.getStartHour() != null && session.getStartHour() >= 21)
				.count();

		if (!sessions.isEmpty() && ((double) sessionsAfter21 / sessions.size()) > 0.7) {
			suggestions.add("Vous étudiez majoritairement après 21h : pensez à préserver votre sommeil.");
		}

		if (consistencyScore < 5) {
			suggestions.add("Vos sessions manquent de régularité : fixez un créneau quotidien.");
		}

		if (productivityScore < 6) {
			suggestions.add("Augmentez progressivement la durée de vos sessions pour plus d'efficacité.");
		}

		if (suggestions.isEmpty()) {
			suggestions.add("Excellent rythme ! Continuez à suivre vos progrès.");
		}

		return ProductivityReport.builder()
				.consistencyScore(round(consistencyScore))
				.productivityScore(round(productivityScore))
				.mostActiveHour(mostActiveHour)
				.suggestions(suggestions)
				.build();
	}

	private double round(double value) {
		return Math.round(value * 10.0) / 10.0;
	}
}

