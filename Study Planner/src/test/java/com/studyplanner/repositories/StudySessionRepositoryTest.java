package com.studyplanner.repositories;

import com.studyplanner.dto.StudySessionDTO;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

class StudySessionRepositoryTest {

    @Test
    void simpleDtoGettersAndSetters_work() {
        StudySessionDTO dto = new StudySessionDTO();
        dto.setDurationMinutes(30);
        dto.setDate(LocalDate.of(2025, 1, 1));
        dto.setStartHour(9);
        dto.setStartMinute(15);

        Assertions.assertEquals(30, dto.getDurationMinutes());
        Assertions.assertEquals(LocalDate.of(2025, 1, 1), dto.getDate());
        Assertions.assertEquals(9, dto.getStartHour());
        Assertions.assertEquals(15, dto.getStartMinute());
    }
}
