using CelalProje.Models;
using Microsoft.EntityFrameworkCore;

namespace CelalProje.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(LrpDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        await EnsureComputersTableSchemaAsync(db);
        await EnsureUserAccountsTableAsync(db);
        await EnsureAdminAccountAsync(db);
        await EnsureAssignedStudentAccountsAsync(db);
    }

    private static async Task EnsureComputersTableSchemaAsync(LrpDbContext db)
    {
        var columns = await db.Database.SqlQueryRaw<string>("SELECT name FROM pragma_table_info('Computers');").ToListAsync();

        await EnsureColumnAsync(db, columns, "AssetCode", "ALTER TABLE Computers ADD COLUMN AssetCode TEXT NOT NULL DEFAULT '';");
        await EnsureColumnAsync(db, columns, "Brand", "ALTER TABLE Computers ADD COLUMN Brand TEXT NOT NULL DEFAULT '';");
        await EnsureColumnAsync(db, columns, "Processor", "ALTER TABLE Computers ADD COLUMN Processor TEXT NOT NULL DEFAULT '';");
        await EnsureColumnAsync(db, columns, "RamGb", "ALTER TABLE Computers ADD COLUMN RamGb INTEGER NOT NULL DEFAULT 0;");
        await EnsureColumnAsync(db, columns, "HasHdmi", "ALTER TABLE Computers ADD COLUMN HasHdmi INTEGER NOT NULL DEFAULT 0;");
        await EnsureColumnAsync(db, columns, "HasVeyon", "ALTER TABLE Computers ADD COLUMN HasVeyon INTEGER NOT NULL DEFAULT 0;");

        await EnsureComputerAssetCodesAsync(db);
        await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_Computers_AssetCode ON Computers (AssetCode);");
    }

    private static async Task EnsureColumnAsync(LrpDbContext db, List<string> columns, string columnName, string sql)
    {
        if (columns.Contains(columnName))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync(sql);
        columns.Add(columnName);
    }

    private static async Task EnsureComputerAssetCodesAsync(LrpDbContext db)
    {
        var computers = await db.Computers
            .OrderBy(c => c.LabId)
            .ThenBy(c => c.Id)
            .ToListAsync();

        var counters = new Dictionary<int, int>();

        foreach (var computer in computers)
        {
            if (!counters.ContainsKey(computer.LabId))
            {
                counters[computer.LabId] = 0;
            }

            counters[computer.LabId]++;
            var expectedCode = $"LAB{computer.LabId}-PC-{counters[computer.LabId]:00}";

            if (computer.AssetCode == expectedCode)
            {
                continue;
            }

            computer.AssetCode = expectedCode;
        }

        await db.SaveChangesAsync();
    }

    private static async Task EnsureUserAccountsTableAsync(LrpDbContext db)
    {
        var sql = """
            CREATE TABLE IF NOT EXISTS UserAccounts (
                Id INTEGER NOT NULL CONSTRAINT PK_UserAccounts PRIMARY KEY AUTOINCREMENT,
                Username TEXT NOT NULL,
                Password TEXT NOT NULL,
                Role TEXT NOT NULL,
                FullName TEXT NOT NULL,
                StudentId INTEGER NULL,
                CONSTRAINT FK_UserAccounts_Students_StudentId FOREIGN KEY (StudentId) REFERENCES Students (Id) ON DELETE CASCADE
            );
            """;

        await db.Database.ExecuteSqlRawAsync(sql);
        await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_UserAccounts_Username ON UserAccounts (Username);");
        await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_UserAccounts_StudentId ON UserAccounts (StudentId) WHERE StudentId IS NOT NULL;");
    }

    private static async Task EnsureAdminAccountAsync(LrpDbContext db)
    {
        var adminExists = await db.UserAccounts.AnyAsync(u => u.Role == "Admin" && u.Username == "admin");
        if (adminExists)
        {
            return;
        }

        db.UserAccounts.Add(new UserAccount
        {
            Username = "admin",
            Password = "1234",
            Role = "Admin",
            FullName = "Sistem Yoneticisi"
        });

        await db.SaveChangesAsync();
    }

    private static async Task EnsureAssignedStudentAccountsAsync(LrpDbContext db)
    {
        var assignedStudents = await db.Students
            .Where(s => s.ResponsibleComputers.Any())
            .ToListAsync();

        foreach (var student in assignedStudents)
        {
            var exists = await db.UserAccounts.AnyAsync(u => u.StudentId == student.Id);
            if (exists)
            {
                continue;
            }

            db.UserAccounts.Add(new UserAccount
            {
                Username = student.StudentNumber,
                Password = student.StudentNumber,
                Role = "Student",
                FullName = $"{student.FirstName} {student.LastName}",
                StudentId = student.Id
            });
        }

        await db.SaveChangesAsync();
    }
}
