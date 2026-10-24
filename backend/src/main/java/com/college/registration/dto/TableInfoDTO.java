package com.college.registration.dto;

import java.util.ArrayList;
import java.util.List;

public class TableInfoDTO {

    private String tableName;
    private List<ColumnInfo> columns = new ArrayList<>();
    private long recordCount;

    public TableInfoDTO() {
    }

    public TableInfoDTO(String tableName, List<ColumnInfo> columns, long recordCount) {
        this.tableName = tableName;
        this.columns = columns != null ? columns : new ArrayList<>();
        this.recordCount = recordCount;
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public List<ColumnInfo> getColumns() {
        return columns;
    }

    public void setColumns(List<ColumnInfo> columns) {
        this.columns = columns;
    }

    public long getRecordCount() {
        return recordCount;
    }

    public void setRecordCount(long recordCount) {
        this.recordCount = recordCount;
    }

    public static class ColumnInfo {
        private String columnName;
        private String dataType;
        private boolean isPrimaryKey;
        private boolean isForeignKey;
        private String referencedTable;
        private boolean isNullable;
        private String defaultValue;

        public ColumnInfo() {
        }

        public ColumnInfo(String columnName, String dataType, boolean isPrimaryKey,
                          boolean isForeignKey, String referencedTable,
                          boolean isNullable, String defaultValue) {
            this.columnName = columnName;
            this.dataType = dataType;
            this.isPrimaryKey = isPrimaryKey;
            this.isForeignKey = isForeignKey;
            this.referencedTable = referencedTable;
            this.isNullable = isNullable;
            this.defaultValue = defaultValue;
        }

        public String getColumnName() {
            return columnName;
        }

        public void setColumnName(String columnName) {
            this.columnName = columnName;
        }

        public String getDataType() {
            return dataType;
        }

        public void setDataType(String dataType) {
            this.dataType = dataType;
        }

        public boolean isPrimaryKey() {
            return isPrimaryKey;
        }

        public void setPrimaryKey(boolean primaryKey) {
            isPrimaryKey = primaryKey;
        }

        public boolean isForeignKey() {
            return isForeignKey;
        }

        public void setForeignKey(boolean foreignKey) {
            isForeignKey = foreignKey;
        }

        public String getReferencedTable() {
            return referencedTable;
        }

        public void setReferencedTable(String referencedTable) {
            this.referencedTable = referencedTable;
        }

        public boolean isNullable() {
            return isNullable;
        }

        public void setNullable(boolean nullable) {
            isNullable = nullable;
        }

        public String getDefaultValue() {
            return defaultValue;
        }

        public void setDefaultValue(String defaultValue) {
            this.defaultValue = defaultValue;
        }
    }
}
