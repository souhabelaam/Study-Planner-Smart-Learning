package com.studyplanner.services;

import com.studyplanner.dto.ProductivityReport;
import com.studyplanner.models.StudySession;
import com.studyplanner.models.User;
import com.studyplanner.repositories.StudySessionRepository;
import com.studyplanner.utils.ProductivityAnalyzer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

	private final StudySessionRepository studySessionRepository;
	private final ProductivityAnalyzer productivityAnalyzer;

	public Map<String, Integer> getDailyTotals(User user, int days) {
		LocalDate end = LocalDate.now();
		LocalDate start = end.minusDays(days - 1L);
		List<StudySession> sessions = studySessionRepository.findByUserAndDateBetween(user, start, end);

		Map<LocalDate, Integer> totals = sessions.stream()
				.collect(Collectors.groupingBy(StudySession::getDate,
						Collectors.summingInt(StudySession::getDurationMinutes)));

		Map<String, Integer> ordered = new LinkedHashMap<>();
		for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
			ordered.put(day.toString(), totals.getOrDefault(day, 0));
		}
		return ordered;
	}

	public Map<String, Integer> getWeeklyTotals(User user, int weeks) {
		LocalDate end = LocalDate.now();
		LocalDate start = end.minusWeeks(weeks - 1L);
		List<StudySession> sessions = studySessionRepository.findByUserAndDateBetween(user, start, end);
		WeekFields wf = WeekFields.of(Locale.getDefault());

		Map<String, Integer> weeklyTotals = sessions.stream()
				.collect(Collectors.groupingBy(session -> {
					LocalDate date = session.getDate();
					int weekNumber = date.get(wf.weekOfWeekBasedYear());
					return date.getYear() + "-W" + weekNumber;
				}, Collectors.summingInt(StudySession::getDurationMinutes)));

		return weeklyTotals.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.collect(Collectors.toMap(
						Map.Entry::getKey,
						Map.Entry::getValue,
						(a, b) -> a,
						LinkedHashMap::new
				));
	}

	public ProductivityReport buildAiReport(User user) {
		List<StudySession> sessions = studySessionRepository.findByUser(user);
		return productivityAnalyzer.analyze(sessions);
	}
}

