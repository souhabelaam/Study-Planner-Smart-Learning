package com.studyplanner.services;

import com.studyplanner.dto.StudySessionDTO;
import com.studyplanner.models.StudySession;
import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import com.studyplanner.repositories.StudySessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudySessionServiceTest {

	@Mock
	private StudySessionRepository studySessionRepository;

	@InjectMocks
	private StudySessionService studySessionService;

	private User testUser;
	private Subject testSubject;

	@BeforeEach
	void setUp() {
		testUser = User.builder()
				.id(1L)
				.username("testuser")
				.email("test@example.com")
				.password("password")
				.build();

		testSubject = Subject.builder()
				.id(1L)
				.name("Maths")
				.user(testUser)
				.build();
	}

	@Test
	void saveSession_ShouldCreateAndSaveSession() {
		// Given
		StudySessionDTO dto = new StudySessionDTO();
		dto.setDurationMinutes(60);
		dto.setDate(LocalDate.of(2025, 1, 15));
		dto.setStartHour(10);
		dto.setStartMinute(0);

		StudySession savedSession = StudySession.builder()
				.id(1L)
				.user(testUser)
				.subject(testSubject)
				.durationMinutes(60)
				.date(LocalDate.of(2025, 1, 15))
				.startHour(10)
				.startMinute(0)
				.build();

		when(studySessionRepository.save(any(StudySession.class))).thenReturn(savedSession);

		// When
		StudySession result = studySessionService.saveSession(testUser, testSubject, dto);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getUser()).isEqualTo(testUser);
		assertThat(result.getSubject()).isEqualTo(testSubject);
		assertThat(result.getDurationMinutes()).isEqualTo(60);
		verify(studySessionRepository).save(any(StudySession.class));
	}

	@Test
	void findForUser_ShouldReturnSortedSessions() {
		// Given
		LocalDate date1 = LocalDate.of(2025, 1, 15);
		LocalDate date2 = LocalDate.of(2025, 1, 20);
		LocalDate date3 = LocalDate.of(2025, 1, 10);

		StudySession session1 = StudySession.builder()
				.id(1L)
				.user(testUser)
				.subject(testSubject)
				.date(date1)
				.build();
		StudySession session2 = StudySession.builder()
				.id(2L)
				.user(testUser)
				.subject(testSubject)
				.date(date2)
				.build();
		StudySession session3 = StudySession.builder()
				.id(3L)
				.user(testUser)
				.subject(testSubject)
				.date(date3)
				.build();

		when(studySessionRepository.findByUser(testUser))
				.thenReturn(Arrays.asList(session1, session2, session3));

		// When
		List<StudySession> result = studySessionService.findForUser(testUser);

		// Then
		assertThat(result).hasSize(3);
		assertThat(result.get(0).getDate()).isEqualTo(date2); // Most recent first
		assertThat(result.get(1).getDate()).isEqualTo(date1);
		assertThat(result.get(2).getDate()).isEqualTo(date3);
	}

	@Test
	void getOwnedSession_WithValidId_ShouldReturnSession() {
		// Given
		Long sessionId = 1L;
		StudySession session = StudySession.builder()
				.id(sessionId)
				.user(testUser)
				.subject(testSubject)
				.build();

		when(studySessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

		// When
		StudySession result = studySessionService.getOwnedSession(testUser, sessionId);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getId()).isEqualTo(sessionId);
	}

	@Test
	void getOwnedSession_WithInvalidId_ShouldThrowException() {
		// Given
		Long sessionId = 999L;
		when(studySessionRepository.findById(sessionId)).thenReturn(Optional.empty());

		// When/Then
		assertThatThrownBy(() -> studySessionService.getOwnedSession(testUser, sessionId))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("Session introuvable");
	}

	@Test
	void getOwnedSession_WithDifferentUser_ShouldThrowException() {
		// Given
		Long sessionId = 1L;
		User otherUser = User.builder().id(2L).build();
		StudySession session = StudySession.builder()
				.id(sessionId)
				.user(otherUser)
				.subject(testSubject)
				.build();

		when(studySessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

		// When/Then
		assertThatThrownBy(() -> studySessionService.getOwnedSession(testUser, sessionId))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("Session introuvable");
	}

	@Test
	void deleteSession_WithValidId_ShouldDelete() {
		// Given
		Long sessionId = 1L;
		StudySession session = StudySession.builder()
				.id(sessionId)
				.user(testUser)
				.subject(testSubject)
				.build();

		when(studySessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
		doNothing().when(studySessionRepository).delete(session);

		// When
		studySessionService.deleteSession(testUser, sessionId);

		// Then
		verify(studySessionRepository).delete(session);
	}

	@Test
	void findBetween_ShouldReturnSessionsInDateRange() {
		// Given
		LocalDate start = LocalDate.of(2025, 1, 10);
		LocalDate end = LocalDate.of(2025, 1, 20);

		StudySession session1 = StudySession.builder()
				.id(4L)
				.user(testUser)
				.subject(testSubject)
				.date(LocalDate.of(2025, 1, 15))
				.build();

		when(studySessionRepository.findByUserAndDateBetween(testUser, start, end))
				.thenReturn(Collections.singletonList(session1));

		// When
		List<StudySession> result = studySessionService.findBetween(testUser, start, end);

		// Then
		assertThat(result).hasSize(1);
		verify(studySessionRepository).findByUserAndDateBetween(testUser, start, end);
	}
}
