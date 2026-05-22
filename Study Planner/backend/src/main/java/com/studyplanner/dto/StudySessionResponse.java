package com.studyplanner.dto;

import com.studyplanner.models.StudySession;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class StudySessionResponse {

	private Long id;
	private Long subjectId;
	private String subjectName;
	private int durationMinutes;
	private LocalDate date;
	private Integer startHour;
	private Integer startMinute;

	public static StudySessionResponse from(StudySession session) {
		var subject = session.getSubject();
		return StudySessionResponse.builder()
				.id(session.getId())
				.subjectId(subject != null ? subject.getId() : null)
				.subjectName(subject != null ? subject.getName() : "Unknown subject")
				.durationMinutes(session.getDurationMinutes())
				.date(session.getDate())
				.startHour(session.getStartHour())
				.startMinute(session.getStartMinute())
				.build();
	}
}
