package com.studyplanner.repositories;

import com.studyplanner.models.Subject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class SubjectRepositoryTest {

    @Test
    void subjectGettersAndSetters_work() {
        Subject s = Subject.builder()
                .id(1L)
                .name("Maths")
                .build();

        Assertions.assertEquals(1L, s.getId());
        Assertions.assertEquals("Maths", s.getName());
    }
}
