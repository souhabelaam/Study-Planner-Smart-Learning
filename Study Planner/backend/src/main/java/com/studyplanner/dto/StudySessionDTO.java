package com.studyplanner.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class StudySessionDTO {

	private Long subjectId;

	@Min(1)
	private int durationMinutes;

	@NotNull
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	private LocalDate date;

	private Integer startHour;

	@Min(0)
	@Max(59)
	private Integer startMinute;
}

