using CelalProje.Models;

namespace CelalProje.Data;

public static class SeedData
{
    public static void Initialize(LrpDbContext db)
    {
        if (db.Labs.Any())
        {
            return;
        }

        var students = new List<Student>
        {
            new() { FirstName = "Ayse", LastName = "Yilmaz", StudentNumber = "2024001", Email = "ayse.yilmaz@okul.edu.tr" },
            new() { FirstName = "Mehmet", LastName = "Demir", StudentNumber = "2024002", Email = "mehmet.demir@okul.edu.tr" },
            new() { FirstName = "Elif", LastName = "Kaya", StudentNumber = "2024003", Email = "elif.kaya@okul.edu.tr" }
        };

        var labs = new List<Lab>
        {
            new() { Name = "Yazilim Laboratuvari", Location = "B Blok - 2. Kat", Capacity = 24 },
            new() { Name = "Ag Laboratuvari", Location = "A Blok - Zemin Kat", Capacity = 16 }
        };

        db.Students.AddRange(students);
        db.Labs.AddRange(labs);
        db.SaveChanges();

        var computers = new List<Computer>
        {
            new() { Name = "PC-01", SerialNumber = "YZL-001", Status = ComputerStatus.Active, LabId = labs[0].Id, ResponsibleStudentId = students[0].Id },
            new() { Name = "PC-02", SerialNumber = "YZL-002", Status = ComputerStatus.Maintenance, LabId = labs[0].Id, ResponsibleStudentId = students[1].Id },
            new() { Name = "PC-03", SerialNumber = "AG-001", Status = ComputerStatus.Active, LabId = labs[1].Id, ResponsibleStudentId = students[2].Id }
        };

        db.Computers.AddRange(computers);
        db.SaveChanges();
    }
}
