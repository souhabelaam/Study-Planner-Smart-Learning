package com.studyplanner.repositories;

import com.studyplanner.models.ERole;
import com.studyplanner.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
	Optional<Role> findByName(ERole name);
}

