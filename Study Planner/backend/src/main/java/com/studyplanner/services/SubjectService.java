package com.studyplanner.services;

import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import com.studyplanner.repositories.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SubjectService {

	private final SubjectRepository subjectRepository;

	public List<Subject> findForUser(User user) {
		return subjectRepository.findByUser(user);
	}

	public Subject saveSubject(User user, Subject subject) {
		subject.setUser(user);
		return subjectRepository.save(subject);
	}

	public List<Subject> saveSubjects(User user, List<String> names) {
		if (names == null || names.isEmpty()) {
			return List.of();
		}
		var existing = new HashSet<String>();
		subjectRepository.findByUser(user).forEach(subject ->
				existing.add(normalize(subject.getName())));

		List<Subject> saved = new ArrayList<>();
		for (String rawName : names) {
			var cleaned = normalize(rawName);
			if (cleaned.isEmpty() || existing.contains(cleaned)) {
				continue;
			}
			Subject subject = Subject.builder()
					.name(rawName.trim())
					.user(user)
					.build();
			saved.add(subjectRepository.save(subject));
			existing.add(cleaned);
		}
		return saved;
	}

	private String normalize(String value) {
		return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
	}

	public Subject getOwnedSubject(User user, Long id) {
		return subjectRepository.findById(id)
				.filter(subject -> subject.getUser().getId().equals(user.getId()))
				.orElseThrow(() -> new IllegalArgumentException("Matière introuvable"));
	}

	public void deleteSubject(User user, Long id) {
		Subject subject = getOwnedSubject(user, id);
		subjectRepository.delete(subject);
	}
}

