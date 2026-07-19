-- ============================================================
-- Task Manager - Azure SQL Database schema
-- Run this once against your Azure SQL Database before first
-- deploy (via Azure Portal Query Editor, Azure Data Studio, or
-- sqlcmd).
-- ============================================================

IF NOT EXISTS (
    SELECT * FROM sys.tables WHERE name = 'tasks'
)
BEGIN
    CREATE TABLE tasks (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        title         NVARCHAR(200)   NOT NULL,
        description   NVARCHAR(MAX)   NULL,
        priority      NVARCHAR(10)    NOT NULL DEFAULT 'Medium'
                          CONSTRAINT CK_tasks_priority
                          CHECK (priority IN ('Low', 'Medium', 'High')),
        status        NVARCHAR(20)    NOT NULL DEFAULT 'Pending'
                          CONSTRAINT CK_tasks_status
                          CHECK (status IN ('Pending', 'Completed')),
        due_date      DATETIME2       NULL,
        created_at    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
    );

    -- Speeds up the common "filter by status, sort by due date" query
    CREATE INDEX IX_tasks_status_due_date ON tasks (status, due_date);
END
