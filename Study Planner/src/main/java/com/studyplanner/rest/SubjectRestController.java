package com.studyplanner.rest;

import com.studyplanner.models.Subject;
import com.studyplanner.services.SubjectService;
import com.studyplanner.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectRestController {

	private final SubjectService subjectService;
	private final UserService userService;

	@GetMapping
	public List<Subject> listSubjects() {
		return subjectService.findForUser(userService.getCurrentUser());
	}

	@PostMapping
	public Subject createSubject(@Valid @RequestBody Subject subject) {
		return subjectService.saveSubject(userService.getCurrentUser(), subject);
	}

	@DeleteMapping("/{id}")
	public void deleteSubject(@PathVariable Long id) {
		subjectService.deleteSubject(userService.getCurrentUser(), id);
	}
}

