package com.college.registration.config;

import com.college.registration.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataBootstrap implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataBootstrap.class);

    private final AdminService adminService;

    public DataBootstrap(AdminService adminService) {
        this.adminService = adminService;
    }

    @Override
    public void run(String... args) {
        logger.info("Initializing system data check and owner bootstrap...");
        try {
            adminService.bootstrapOwner();
        } catch (Exception e) {
            logger.error("Error occurred while bootstrapping owner account: {}", e.getMessage(), e);
        }
    }
}
