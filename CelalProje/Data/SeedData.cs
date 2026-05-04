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
            new() { Name = "PC-01", AssetCode = "LAB1-PC-01", SerialNumber = "YZL-001", Brand = "Dell", Processor = "Intel Core i5", RamGb = 8, HasHdmi = true, HasVeyon = true, Status = ComputerStatus.Active, LabId = labs[0].Id, ResponsibleStudentId = students[0].Id },
            new() { Name = "PC-02", AssetCode = "LAB1-PC-02", SerialNumber = "YZL-002", Brand = "HP", Processor = "Intel Core i7", RamGb = 16, HasHdmi = true, HasVeyon = false, Status = ComputerStatus.Maintenance, LabId = labs[0].Id, ResponsibleStudentId = students[1].Id },
            new() { Name = "PC-03", AssetCode = "LAB2-PC-01", SerialNumber = "AG-001", Brand = "Lenovo", Processor = "AMD Ryzen 5", RamGb = 8, HasHdmi = false, HasVeyon = true, Status = ComputerStatus.Active, LabId = labs[1].Id, ResponsibleStudentId = students[2].Id }
        };

        db.Computers.AddRange(computers);
        db.SaveChanges();
    }
}
