package com.studyplanner.services;

import com.studyplanner.dto.StudySessionDTO;
import com.studyplanner.models.StudySession;
import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import com.studyplanner.repositories.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudySessionService {

	private final StudySessionRepository studySessionRepository;

	public List<StudySession> findForUser(User user) {
		return studySessionRepository.findByUser(user)
				.stream()
				.sorted(Comparator.comparing(StudySession::getDate).reversed())
				.toList();
	}

	public StudySession saveSession(User user, Subject subject, StudySessionDTO dto) {
		StudySession session = StudySession.builder()
				.user(user)
				.subject(subject)
				.durationMinutes(dto.getDurationMinutes())
				.date(dto.getDate())
				.startHour(dto.getStartHour())
				.startMinute(dto.getStartMinute())
				.build();
		return studySessionRepository.save(session);
	}

	public StudySession getOwnedSession(User user, Long id) {
		return studySessionRepository.findById(id)
				.filter(s -> s.getUser().getId().equals(user.getId()))
				.orElseThrow(() -> new IllegalArgumentException("Session introuvable"));
	}

	public void deleteSession(User user, Long id) {
		studySessionRepository.delete(getOwnedSession(user, id));
	}

	public List<StudySession> findBetween(User user, LocalDate start, LocalDate end) {
		return studySessionRepository.findByUserAndDateBetween(user, start, end);
	}
}

