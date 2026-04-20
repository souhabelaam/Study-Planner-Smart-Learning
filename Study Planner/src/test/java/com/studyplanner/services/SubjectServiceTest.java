package com.studyplanner.services;

import com.studyplanner.models.Subject;
import com.studyplanner.models.User;
import com.studyplanner.repositories.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubjectServiceTest {

	@Mock
	private SubjectRepository subjectRepository;

	@InjectMocks
	private SubjectService subjectService;

	private User testUser;

	@BeforeEach
	void setUp() {
		testUser = User.builder()
				.id(1L)
				.username("testuser")
				.email("test@example.com")
				.password("password")
				.build();
	}

	@Test
	void saveSubject_ShouldSetUserAndSave() {
		// Given
		Subject subject = Subject.builder()
				.name("Maths")
				.build();
		Subject savedSubject = Subject.builder()
				.id(1L)
				.name("Maths")
				.user(testUser)
				.build();

		when(subjectRepository.save(any(Subject.class))).thenReturn(savedSubject);

		// When
		Subject result = subjectService.saveSubject(testUser, subject);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getUser()).isEqualTo(testUser);
		assertThat(result.getName()).isEqualTo("Maths");
		verify(subjectRepository).save(subject);
	}

	@Test
	void saveSubjects_WithEmptyList_ShouldReturnEmptyList() {
		// When
		List<Subject> result = subjectService.saveSubjects(testUser, Collections.emptyList());

		// Then
		assertThat(result).isEmpty();
		verify(subjectRepository, never()).save(any());
	}

	@Test
	void saveSubjects_WithNullList_ShouldReturnEmptyList() {
		// When
		List<Subject> result = subjectService.saveSubjects(testUser, null);

		// Then
		assertThat(result).isEmpty();
		verify(subjectRepository, never()).save(any());
	}

	@Test
	void saveSubjects_WithDuplicateNames_ShouldSaveOnlyUnique() {
		// Given
		List<String> names = Arrays.asList("Maths", "Physics", "Maths", "  maths  ");
		when(subjectRepository.findByUser(testUser)).thenReturn(Collections.emptyList());
		when(subjectRepository.save(any(Subject.class))).thenAnswer(invocation -> {
			Subject s = invocation.getArgument(0);
			return Subject.builder()
					.id(System.currentTimeMillis())
					.name(s.getName())
					.user(s.getUser())
					.build();
		});

		// When
		List<Subject> result = subjectService.saveSubjects(testUser, names);

		// Then
		assertThat(result).hasSize(2);
		verify(subjectRepository, times(2)).save(any(Subject.class));
	}

	@Test
	void getOwnedSubject_WithValidId_ShouldReturnSubject() {
		// Given
		Long subjectId = 1L;
		Subject subject = Subject.builder()
				.id(subjectId)
				.name("Maths")
				.user(testUser)
				.build();

		when(subjectRepository.findById(subjectId)).thenReturn(Optional.of(subject));

		// When
		Subject result = subjectService.getOwnedSubject(testUser, subjectId);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getId()).isEqualTo(subjectId);
	}

	@Test
	void getOwnedSubject_WithInvalidId_ShouldThrowException() {
		// Given
		Long subjectId = 999L;
		when(subjectRepository.findById(subjectId)).thenReturn(Optional.empty());

		// When/Then
		assertThatThrownBy(() -> subjectService.getOwnedSubject(testUser, subjectId))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("Matière introuvable");
	}

	@Test
	void getOwnedSubject_WithDifferentUser_ShouldThrowException() {
		// Given
		Long subjectId = 1L;
		User otherUser = User.builder().id(2L).build();
		Subject subject = Subject.builder()
				.id(subjectId)
				.name("Maths")
				.user(otherUser)
				.build();

		when(subjectRepository.findById(subjectId)).thenReturn(Optional.of(subject));

		// When/Then
		assertThatThrownBy(() -> subjectService.getOwnedSubject(testUser, subjectId))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("Matière introuvable");
	}

	@Test
	void deleteSubject_WithValidId_ShouldDelete() {
		// Given
		Long subjectId = 1L;
		Subject subject = Subject.builder()
				.id(subjectId)
				.name("Maths")
				.user(testUser)
				.build();

		when(subjectRepository.findById(subjectId)).thenReturn(Optional.of(subject));
		doNothing().when(subjectRepository).delete(subject);

		// When
		subjectService.deleteSubject(testUser, subjectId);

		// Then
		verify(subjectRepository).delete(subject);
	}
}
