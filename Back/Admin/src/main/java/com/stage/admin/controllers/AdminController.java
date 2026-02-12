package com.stage.admin.controllers;

import org.springframework.web.bind.annotation.*;
import com.stage.admin.entities.Admin;
import com.stage.admin.services.AdminService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/me")
    public Admin getMe() {
        return adminService.getCurrentAdmin();
    }

    @PutMapping("/me")
    public Admin updateMe(@RequestBody Admin admin) {
        return adminService.updateCurrentAdmin(admin);
    }
}
