package com.studyplanner.services;

import com.studyplanner.dto.SignupRequest;
import com.studyplanner.models.ERole;
import com.studyplanner.models.Role;
import com.studyplanner.models.User;
import com.studyplanner.repositories.RoleRepository;
import com.studyplanner.repositories.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;

	@PostConstruct
	public void initRoles() {
		for (ERole role : ERole.values()) {
			roleRepository.findByName(role).orElseGet(() -> roleRepository.save(
					Role.builder().name(role).build()
			));
		}
	}

	public User registerUser(SignupRequest request, boolean admin) {
		if (userRepository.existsByUsername(request.getUsername())) {
			throw new IllegalArgumentException("Le nom d'utilisateur est déjà utilisé.");
		}
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new IllegalArgumentException("L'email est déjà utilisé.");
		}

		Set<Role> roles = new HashSet<>();
		roleRepository.findByName(admin ? ERole.ADMIN : ERole.USER)
				.ifPresent(roles::add);

		User user = User.builder()
				.username(request.getUsername())
				.email(request.getEmail())
				.password(passwordEncoder.encode(request.getPassword()))
				.roles(roles)
				.build();
		return userRepository.save(user);
	}

	public Optional<User> findByUsername(String username) {
		return userRepository.findByUsername(username);
	}

	public User getCurrentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null ||
				!authentication.isAuthenticated() ||
				authentication instanceof AnonymousAuthenticationToken) {
			throw new UsernameNotFoundException("Utilisateur non authentifié");
		}
		return userRepository.findByUsername(authentication.getName())
				.orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable"));
	}
}

