package com.college.registration.controller;

import com.college.registration.dto.ApiResponse;
import com.college.registration.dto.TableInfoDTO;
import com.college.registration.service.DatabaseExplorerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasRole('OWNER')")
@Validated
public class OwnerController {

    private final DatabaseExplorerService databaseExplorerService;

    public OwnerController(DatabaseExplorerService databaseExplorerService) {
        this.databaseExplorerService = databaseExplorerService;
    }

    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<String>>> getTables() {
        List<String> tables = databaseExplorerService.getTableList();
        return ResponseEntity.ok(ApiResponse.success(tables));
    }

    @GetMapping("/tables/{tableName}")
    public ResponseEntity<ApiResponse<TableInfoDTO>> getTableInfo(@PathVariable("tableName") String tableName) {
        TableInfoDTO tableInfo = databaseExplorerService.getTableInfo(tableName);
        return ResponseEntity.ok(ApiResponse.success(tableInfo));
    }

    @GetMapping("/tables/{tableName}/records")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTableRecords(
            @PathVariable("tableName") String tableName,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "search", required = false) String search) {
        List<Map<String, Object>> records = databaseExplorerService.getTableRecords(tableName, page, size, search);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/db-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDatabaseStatus() {
        Map<String, Object> status = databaseExplorerService.getDatabaseStatus();
        return ResponseEntity.ok(ApiResponse.success(status));
    }
}
