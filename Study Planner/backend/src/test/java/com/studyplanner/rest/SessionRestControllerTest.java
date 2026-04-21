package com.studyplanner.rest;

import com.studyplanner.models.StudySession;
import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

class SessionRestControllerTest {

    @Test
    void studySessionModel_work() {
        User user = User.builder().id(1L).username("u").build();
        Subject subject = Subject.builder().id(1L).name("Maths").user(user).build();

        StudySession s = StudySession.builder()
                .id(1L)
                .user(user)
                .subject(subject)
                .durationMinutes(45)
                .date(LocalDate.of(2025,1,15))
                .build();

        Assertions.assertEquals(45, s.getDurationMinutes());
        Assertions.assertEquals(subject, s.getSubject());
        Assertions.assertEquals(user, s.getUser());
    }
}
