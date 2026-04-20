package com.studyplanner.utils;

import com.studyplanner.dto.ProductivityReport;
import com.studyplanner.models.StudySession;
import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProductivityAnalyzerTest {

	private ProductivityAnalyzer analyzer;
	private User testUser;
	private Subject testSubject;

	@BeforeEach
	void setUp() {
		analyzer = new ProductivityAnalyzer();
		testUser = User.builder()
				.id(1L)
				.username("testuser")
				.build();
		testSubject = Subject.builder()
				.id(1L)
				.name("Maths")
				.build();
	}

	@Test
	void analyze_WithEmptyList_ShouldReturnDefaultReport() {
		// When
		ProductivityReport report = analyzer.analyze(Collections.emptyList());

		// Then
		assertThat(report).isNotNull();
		assertThat(report.getConsistencyScore()).isEqualTo(0);
		assertThat(report.getProductivityScore()).isEqualTo(0);
		assertThat(report.getSuggestions()).isNotEmpty();
	}

	@Test
	void analyze_WithNullList_ShouldReturnDefaultReport() {
		// When
		ProductivityReport report = analyzer.analyze(null);

		// Then
		assertThat(report).isNotNull();
		assertThat(report.getConsistencyScore()).isEqualTo(0);
		assertThat(report.getProductivityScore()).isEqualTo(0);
	}

	@Test
	void analyze_WithConsistentSessions_ShouldCalculateScores() {
		// Given
		List<StudySession> sessions = new ArrayList<>();
		for (int i = 0; i < 5; i++) {
			sessions.add(StudySession.builder()
					.user(testUser)
					.subject(testSubject)
					.durationMinutes(60)
					.date(LocalDate.of(2025, 1, 10 + i))
					.startHour(10)
					.startMinute(0)
					.build());
		}

		// When
		ProductivityReport report = analyzer.analyze(sessions);

		// Then
		assertThat(report).isNotNull();
		assertThat(report.getConsistencyScore()).isGreaterThan(0);
		assertThat(report.getProductivityScore()).isGreaterThan(0);
		assertThat(report.getMostActiveHour()).isEqualTo(10);
	}

	@Test
	void analyze_WithLateNightSessions_ShouldSuggestSleepAdvice() {
		// Given
		List<StudySession> sessions = new ArrayList<>();
		for (int i = 0; i < 10; i++) {
			sessions.add(StudySession.builder()
					.user(testUser)
					.subject(testSubject)
					.durationMinutes(30)
					.date(LocalDate.of(2025, 1, 10 + i))
					.startHour(22)
					.startMinute(0)
					.build());
		}

		// When
		ProductivityReport report = analyzer.analyze(sessions);

		// Then
		assertThat(report.getSuggestions())
				.anyMatch(s -> s.contains("sommeil"));
	}

	@Test
	void analyze_WithLowConsistency_ShouldSuggestRegularity() {
		// Given
		List<StudySession> sessions = new ArrayList<>();
		sessions.add(StudySession.builder()
				.user(testUser)
				.subject(testSubject)
				.durationMinutes(120)
				.date(LocalDate.of(2025, 1, 10))
				.startHour(10)
				.build());
		sessions.add(StudySession.builder()
				.user(testUser)
				.subject(testSubject)
				.durationMinutes(15)
				.date(LocalDate.of(2025, 1, 20))
				.startHour(10)
				.build());

		// When
		ProductivityReport report = analyzer.analyze(sessions);

		// Then
		assertThat(report.getConsistencyScore()).isLessThan(5);
		assertThat(report.getSuggestions())
				.anyMatch(s -> s.contains("régularité") || s.contains("régulier"));
	}
}
