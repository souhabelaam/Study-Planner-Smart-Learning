package com.studyplanner.security.controllers;

import com.studyplanner.dto.JwtResponse;
import com.studyplanner.dto.LoginRequest;
import com.studyplanner.dto.SignupRequest;
import com.studyplanner.security.JwtUtils;
import com.studyplanner.security.UserDetailsImpl;
import com.studyplanner.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final JwtUtils jwtUtils;
	private final UserService userService;

	@PostMapping("/login")
	public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
		Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

		SecurityContextHolder.getContext().setAuthentication(authentication);
		String jwt = jwtUtils.generateJwtToken(authentication);
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		List<String> roles = userDetails.getAuthorities().stream()
				.map(auth -> auth.getAuthority())
				.toList();

		return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getUsername(), roles));
	}

	@PostMapping("/register")
	public ResponseEntity<String> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
		userService.registerUser(signupRequest, false);
		return ResponseEntity.ok("Utilisateur créé avec succès");
	}
}

