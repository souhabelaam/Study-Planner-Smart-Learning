package com.studyplanner.repositories;

import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
	List<Subject> findByUser(User user);
}

