package com.studyplanner.repositories;

import com.studyplanner.models.StudySession;
import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
	List<StudySession> findByUser(User user);

	@Query("SELECT s FROM StudySession s JOIN FETCH s.subject WHERE s.user = :user")
	List<StudySession> findByUserWithSubject(@Param("user") User user);

	@Query("SELECT s FROM StudySession s JOIN FETCH s.subject WHERE s.id = :id AND s.user.id = :userId")
	Optional<StudySession> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

	long countByUser(User user);

	List<StudySession> findByUserAndDate(User user, LocalDate date);
	List<StudySession> findByUserAndDateBetween(User user, LocalDate start, LocalDate end);
	List<StudySession> findBySubject(Subject subject);
}

