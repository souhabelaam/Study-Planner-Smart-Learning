package com.studyplanner.rest;

import com.studyplanner.dto.StudySessionDTO;
import com.studyplanner.models.StudySession;
import com.studyplanner.services.StudySessionService;
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
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionRestController {

	private final StudySessionService studySessionService;
	private final SubjectService subjectService;
	private final UserService userService;

	@GetMapping
	public List<StudySession> listSessions() {
		return studySessionService.findForUser(userService.getCurrentUser());
	}

	@GetMapping("/{id}")
	public StudySession getSession(@PathVariable Long id) {
		return studySessionService.getOwnedSession(userService.getCurrentUser(), id);
	}

	@PostMapping
	public StudySession createSession(@Valid @RequestBody StudySessionDTO dto) {
		var user = userService.getCurrentUser();
		var subject = subjectService.getOwnedSubject(user, dto.getSubjectId());
		return studySessionService.saveSession(user, subject, dto);
	}

	@DeleteMapping("/{id}")
	public void deleteSession(@PathVariable Long id) {
		studySessionService.deleteSession(userService.getCurrentUser(), id);
	}
}

