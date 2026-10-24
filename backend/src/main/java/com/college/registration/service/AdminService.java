package com.college.registration.service;

import com.college.registration.dto.AdminDTO;
import com.college.registration.entity.Admin;
import com.college.registration.exception.ResourceNotFoundException;
import com.college.registration.repository.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.owner.username:}")
    private String ownerUsername;

    @Value("${app.owner.password:}")
    private String ownerPassword;

    @Value("${app.owner.email:owner@college.edu}")
    private String ownerEmail;

    @Value("${app.owner.fullname:System Owner}")
    private String ownerFullName;

    public AdminService(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void bootstrapOwner() {
        if (adminRepository.existsByRole(Admin.Role.OWNER)) {
            logger.info("Owner account already exists. Skipping bootstrap.");
            return;
        }

        if (ownerUsername == null || ownerUsername.trim().isEmpty() ||
            ownerPassword == null || ownerPassword.trim().isEmpty()) {
            logger.info("OWNER_USERNAME or OWNER_PASSWORD not provided in environment. Skipping bootstrap.");
            return;
        }

        String username = ownerUsername.trim();
        if (adminRepository.existsByUsername(username)) {
            logger.warn("Username '{}' already exists in admin table, cannot create owner.", username);
            return;
        }

        Admin owner = new Admin();
        owner.setUsername(username);
        owner.setPasswordHash(passwordEncoder.encode(ownerPassword.trim()));
        owner.setFullName(ownerFullName != null ? ownerFullName.trim() : "System Owner");
        owner.setEmail(ownerEmail != null ? ownerEmail.trim() : "owner@college.edu");
        owner.setRole(Admin.Role.OWNER);
        owner.setIsActive(true);

        adminRepository.save(owner);
        logger.info("Successfully bootstrapped initial owner account: {}", username);
    }

    @Transactional(readOnly = true)
    public AdminDTO getAdminByUsername(String username) {
        Admin admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "username", username));
        return mapToDTO(admin);
    }

    public AdminDTO mapToDTO(Admin admin) {
        if (admin == null) {
            return null;
        }
        return new AdminDTO(
                admin.getAdminId(),
                admin.getUsername(),
                admin.getFullName(),
                admin.getEmail(),
                admin.getRole() != null ? admin.getRole().name() : null,
                admin.getIsActive()
        );
    }
}
