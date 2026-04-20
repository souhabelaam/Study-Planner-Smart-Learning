package com.studyplanner.rest;

import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class SubjectRestControllerTest {

    @Test
    void subjectModel_work() {
        User user = User.builder().id(1L).username("u").build();
        Subject s = Subject.builder().id(2L).name("Physics").user(user).build();

        Assertions.assertEquals(2L, s.getId());
        Assertions.assertEquals("Physics", s.getName());
        Assertions.assertEquals(user, s.getUser());
    }
}
