package com.college.registration.service;

import com.college.registration.dto.TableInfoDTO;
import com.college.registration.exception.BadRequestException;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

@Service
public class DatabaseExplorerService {

    private static final Set<String> ALLOWED_TABLES = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList("department", "student", "course", "registration", "admin"))
    );

    private final DataSource dataSource;

    public DatabaseExplorerService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void validateTableName(String tableName) {
        if (tableName == null || !ALLOWED_TABLES.contains(tableName.toLowerCase().trim())) {
            throw new BadRequestException("Table '" + tableName + "' is not accessible or does not exist.");
        }
    }

    public List<String> getTableList() {
        List<String> tables = new ArrayList<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            String catalog = conn.getCatalog();
            try (ResultSet rs = metaData.getTables(catalog, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tblName = rs.getString("TABLE_NAME");
                    if (tblName != null && ALLOWED_TABLES.contains(tblName.toLowerCase())) {
                        tables.add(tblName.toLowerCase());
                    }
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to retrieve table list: " + e.getMessage(), e);
        }

        // Ensure all allowed tables are present if DB returns empty due to permissions/views
        if (tables.isEmpty()) {
            tables.addAll(ALLOWED_TABLES);
        }
        Collections.sort(tables);
        return tables;
    }

    public TableInfoDTO getTableInfo(String tableName) {
        validateTableName(tableName);
        String cleanTableName = tableName.toLowerCase().trim();

        List<TableInfoDTO.ColumnInfo> columns = new ArrayList<>();
        long recordCount = getRecordCount(cleanTableName);

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            String catalog = conn.getCatalog();

            // Primary keys
            Set<String> primaryKeys = new HashSet<>();
            try (ResultSet pkRs = metaData.getPrimaryKeys(catalog, null, cleanTableName)) {
                while (pkRs.next()) {
                    primaryKeys.add(pkRs.getString("COLUMN_NAME"));
                }
            }

            // Foreign keys
            Map<String, String> foreignKeys = new HashMap<>();
            try (ResultSet fkRs = metaData.getImportedKeys(catalog, null, cleanTableName)) {
                while (fkRs.next()) {
                    String fkCol = fkRs.getString("FKCOLUMN_NAME");
                    String pkTable = fkRs.getString("PKTABLE_NAME");
                    foreignKeys.put(fkCol, pkTable);
                }
            }

            // Columns
            try (ResultSet colRs = metaData.getColumns(catalog, null, cleanTableName, "%")) {
                while (colRs.next()) {
                    String colName = colRs.getString("COLUMN_NAME");
                    String typeName = colRs.getString("TYPE_NAME");
                    int nullableInt = colRs.getInt("NULLABLE");
                    boolean isNullable = (nullableInt == DatabaseMetaData.columnNullable);
                    String defaultValue = colRs.getString("COLUMN_DEF");
                    boolean isPk = primaryKeys.contains(colName);
                    boolean isFk = foreignKeys.containsKey(colName);
                    String refTable = foreignKeys.get(colName);

                    columns.add(new TableInfoDTO.ColumnInfo(
                            colName,
                            typeName,
                            isPk,
                            isFk,
                            refTable,
                            isNullable,
                            defaultValue
                    ));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to retrieve table info for " + cleanTableName + ": " + e.getMessage(), e);
        }

        return new TableInfoDTO(cleanTableName, columns, recordCount);
    }

    public List<Map<String, Object>> getTableRecords(String tableName, int page, int size, String search) {
        validateTableName(tableName);
        String cleanTableName = tableName.toLowerCase().trim();

        int limit = Math.max(1, Math.min(size, 100));
        int offset = Math.max(0, page) * limit;

        List<Map<String, Object>> records = new ArrayList<>();

        try (Connection conn = dataSource.getConnection()) {
            List<String> searchableColumns = getSearchableColumns(conn, cleanTableName);

            StringBuilder sql = new StringBuilder("SELECT * FROM `").append(cleanTableName).append("`");
            boolean hasSearch = search != null && !search.trim().isEmpty() && !searchableColumns.isEmpty();

            if (hasSearch) {
                sql.append(" WHERE ");
                for (int i = 0; i < searchableColumns.size(); i++) {
                    if (i > 0) {
                        sql.append(" OR ");
                    }
                    sql.append("`").append(searchableColumns.get(i)).append("` LIKE ?");
                }
            }

            sql.append(" LIMIT ? OFFSET ?");

            try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
                int paramIdx = 1;
                if (hasSearch) {
                    String searchPattern = "%" + search.trim() + "%";
                    for (int i = 0; i < searchableColumns.size(); i++) {
                        stmt.setString(paramIdx++, searchPattern);
                    }
                }
                stmt.setInt(paramIdx++, limit);
                stmt.setInt(paramIdx, offset);

                try (ResultSet rs = stmt.executeQuery()) {
                    ResultSetMetaData md = rs.getMetaData();
                    int colCount = md.getColumnCount();

                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int i = 1; i <= colCount; i++) {
                            String colName = md.getColumnLabel(i);
                            // Strictly filter out password_hash
                            if ("password_hash".equalsIgnoreCase(colName)) {
                                continue;
                            }
                            row.put(colName, rs.getObject(i));
                        }
                        records.add(row);
                    }
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to query records for " + cleanTableName + ": " + e.getMessage(), e);
        }

        return records;
    }

    public long getRecordCount(String tableName) {
        validateTableName(tableName);
        String cleanTableName = tableName.toLowerCase().trim();

        String sql = "SELECT COUNT(*) FROM `" + cleanTableName + "`";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                return rs.getLong(1);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to count records for " + cleanTableName + ": " + e.getMessage(), e);
        }
        return 0L;
    }

    public Map<String, Object> getDatabaseStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            status.put("databaseName", conn.getCatalog());
            status.put("connectionValid", conn.isValid(5));
            status.put("serverProduct", metaData.getDatabaseProductName());
            status.put("serverVersion", metaData.getDatabaseProductVersion());
            status.put("driverName", metaData.getDriverName());
            status.put("driverVersion", metaData.getDriverVersion());
        } catch (SQLException e) {
            status.put("connectionValid", false);
            status.put("error", e.getMessage());
        }
        return status;
    }

    private List<String> getSearchableColumns(Connection conn, String tableName) throws SQLException {
        List<String> searchable = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        String catalog = conn.getCatalog();

        try (ResultSet rs = metaData.getColumns(catalog, null, tableName, "%")) {
            while (rs.next()) {
                String colName = rs.getString("COLUMN_NAME");
                int dataType = rs.getInt("DATA_TYPE");
                if (isTextType(dataType) && !"password_hash".equalsIgnoreCase(colName)) {
                    searchable.add(colName);
                }
            }
        }
        return searchable;
    }

    private boolean isTextType(int dataType) {
        return dataType == Types.CHAR ||
               dataType == Types.VARCHAR ||
               dataType == Types.LONGVARCHAR ||
               dataType == Types.NCHAR ||
               dataType == Types.NVARCHAR ||
               dataType == Types.LONGNVARCHAR;
    }
}
