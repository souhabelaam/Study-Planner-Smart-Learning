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
		System.out.println("\n========== [DEBUG] DÉBUT ENREGISTREMENT UTILISATEUR ==========");
		System.out.println("[DEBUG] Username: " + (request.getUsername() != null ? request.getUsername() : "NULL"));
		System.out.println("[DEBUG] Email: " + (request.getEmail() != null ? request.getEmail() : "NULL"));
		
		// Vérifier les doublons
		if (userRepository.existsByUsername(request.getUsername())) {
			System.out.println("[DEBUG] ❌ Nom d'utilisateur déjà utilisé: " + request.getUsername());
			throw new IllegalArgumentException("Le nom d'utilisateur est déjà utilisé.");
		}
		if (userRepository.existsByEmail(request.getEmail())) {
			System.out.println("[DEBUG] ❌ Email déjà utilisé: " + request.getEmail());
			throw new IllegalArgumentException("L'email est déjà utilisé.");
		}
		System.out.println("[DEBUG] ✓ Vérifications de doublons passées");

		// Récupérer le rôle
		Set<Role> roles = new HashSet<>();
		roleRepository.findByName(admin ? ERole.ADMIN : ERole.USER)
				.ifPresent(roles::add);
		System.out.println("[DEBUG] Rôle assigné: " + (admin ? "ADMIN" : "USER") + " (" + roles.size() + " rôle(s))");

		// Créer l'utilisateur
		User user = User.builder()
				.username(request.getUsername())
				.email(request.getEmail())
				.password(passwordEncoder.encode(request.getPassword()))
				.roles(roles)
				.build();
		System.out.println("[DEBUG] Objet User créé (avant sauvegarde)");

		// Sauvegarder en MySQL
		System.out.println("[DEBUG] >>> Début de la sauvegarde en MySQL...");
		try {
			User savedUser = userRepository.save(user);
			System.out.println("[DEBUG] ✓✓✓ Utilisateur SAUVEGARDÉ avec succès! ✓✓✓");
			System.out.println("[DEBUG] ID MySQL: " + savedUser.getId());
			System.out.println("[DEBUG] Username: " + savedUser.getUsername());
			System.out.println("[DEBUG] Email: " + savedUser.getEmail());
			
			// Vérification immédiate que l'utilisateur est bien en base
			Optional<User> verify = userRepository.findById(savedUser.getId());
			if (verify.isPresent()) {
				System.out.println("[DEBUG] ✓✓✓ VÉRIFICATION RÉUSSIE: Utilisateur trouvé en base de données MySQL! ✓✓✓");
			} else {
				System.out.println("[DEBUG] ❌❌❌ ERREUR CRITIQUE: Utilisateur NON trouvé après sauvegarde! ❌❌❌");
			}
			
			// Vérification par username
			Optional<User> verifyByUsername = userRepository.findByUsername(savedUser.getUsername());
			if (verifyByUsername.isPresent()) {
				System.out.println("[DEBUG] ✓✓✓ Vérification par username RÉUSSIE: Utilisateur trouvé! ✓✓✓");
			} else {
				System.out.println("[DEBUG] ❌❌❌ ERREUR: Utilisateur non trouvé par username! ❌❌❌");
			}
			
			// Compter tous les utilisateurs
			long totalUsers = userRepository.count();
			System.out.println("[DEBUG] Nombre total d'utilisateurs en base: " + totalUsers);
			
			System.out.println("========== [DEBUG] FIN ENREGISTREMENT UTILISATEUR ==========\n");
			return savedUser;
		} catch (Exception e) {
			System.out.println("[DEBUG] ❌❌❌ EXCEPTION lors de la sauvegarde: " + e.getMessage());
			e.printStackTrace();
			throw e;
		}
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

