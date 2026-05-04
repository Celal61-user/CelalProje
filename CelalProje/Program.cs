using CelalProje.Data;
using CelalProje.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<LrpDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("LrpConnection")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LrpDbContext>();
    await DbInitializer.InitializeAsync(db);
    SeedData.Initialize(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseDefaultFiles(new DefaultFilesOptions
{
    DefaultFileNames = ["login.html"]
});
app.UseStaticFiles();

var auth = app.MapGroup("/api/auth").WithTags("Auth");
var labs = app.MapGroup("/api/labs").WithTags("Labs");
var computers = app.MapGroup("/api/computers").WithTags("Computers");
var students = app.MapGroup("/api/students").WithTags("Students");
var dashboard = app.MapGroup("/api/dashboard").WithTags("Dashboard");

auth.MapPost("/login", async (LoginRequest request, LrpDbContext db) =>
{
    var user = await db.UserAccounts.FirstOrDefaultAsync(u =>
        u.Username == request.Username &&
        u.Password == request.Password);

    if (user is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new
    {
        username = user.Username,
        fullName = user.FullName,
        role = user.Role,
        redirectUrl = user.Role == "Admin" ? "/index.html" : "/student.html"
    });
});

labs.MapGet("/", async (LrpDbContext db) =>
    await db.Labs
        .Include(l => l.Computers)
        .OrderBy(l => l.Name)
        .Select(l => new
        {
            l.Id,
            l.Name,
            l.Location,
            l.Capacity,
            ComputerCount = l.Computers.Count,
            ActiveComputerCount = l.Computers.Count(c => c.Status == ComputerStatus.Active)
        })
        .ToListAsync());

labs.MapGet("/{id:int}", async (int id, LrpDbContext db) =>
{
    var lab = await db.Labs
        .Include(l => l.Computers)
        .ThenInclude(c => c.ResponsibleStudent)
        .FirstOrDefaultAsync(l => l.Id == id);

    return lab is null ? Results.NotFound() : Results.Ok(lab);
});

labs.MapPost("/", async (Lab lab, LrpDbContext db) =>
{
    db.Labs.Add(lab);
    await db.SaveChangesAsync();
    return Results.Created($"/api/labs/{lab.Id}", lab);
});

labs.MapPut("/{id:int}", async (int id, Lab input, LrpDbContext db) =>
{
    var lab = await db.Labs.FindAsync(id);
    if (lab is null) return Results.NotFound();

    lab.Name = input.Name;
    lab.Location = input.Location;
    lab.Capacity = input.Capacity;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

labs.MapDelete("/{id:int}", async (int id, LrpDbContext db) =>
{
    var lab = await db.Labs.Include(l => l.Computers).FirstOrDefaultAsync(l => l.Id == id);
    if (lab is null) return Results.NotFound();
    if (lab.Computers.Count > 0)
    {
        return Results.BadRequest(new { message = "Bu laboratuvara bagli bilgisayarlar silinmeden laboratuvar kaldirilamaz." });
    }

    db.Labs.Remove(lab);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

computers.MapGet("/", async (LrpDbContext db) =>
    await db.Computers
        .Include(c => c.Lab)
        .Include(c => c.ResponsibleStudent)
        .OrderBy(c => c.Name)
        .Select(c => new
        {
            c.Id,
            c.Name,
            c.AssetCode,
            c.SerialNumber,
            c.Brand,
            c.Processor,
            c.RamGb,
            c.HasHdmi,
            c.HasVeyon,
            c.Status,
            c.LabId,
            LabName = c.Lab!.Name,
            c.ResponsibleStudentId,
            ResponsibleStudentName = c.ResponsibleStudent != null
                ? $"{c.ResponsibleStudent.FirstName} {c.ResponsibleStudent.LastName}"
                : null
        })
        .ToListAsync());

computers.MapGet("/{id:int}", async (int id, LrpDbContext db) =>
{
    var computer = await db.Computers
        .Include(c => c.Lab)
        .Include(c => c.ResponsibleStudent)
        .FirstOrDefaultAsync(c => c.Id == id);

    return computer is null ? Results.NotFound() : Results.Ok(computer);
});

computers.MapPost("/", async (Computer computer, LrpDbContext db) =>
{
    var labExists = await db.Labs.AnyAsync(l => l.Id == computer.LabId);
    if (!labExists)
    {
        return Results.BadRequest(new { message = "Gecerli bir laboratuvar seciniz." });
    }

    var studentExists = computer.ResponsibleStudentId is null
        || await db.Students.AnyAsync(s => s.Id == computer.ResponsibleStudentId.Value);
    if (!studentExists)
    {
        return Results.BadRequest(new { message = "Gecerli bir ogrenci seciniz." });
    }

    computer.AssetCode = await GenerateAssetCode(db, computer.LabId);
    db.Computers.Add(computer);
    if (computer.ResponsibleStudentId.HasValue)
    {
        await EnsureStudentAccountAsync(db, computer.ResponsibleStudentId.Value);
    }
    await db.SaveChangesAsync();
    return Results.Created($"/api/computers/{computer.Id}", computer);
});

computers.MapPut("/{id:int}", async (int id, Computer input, LrpDbContext db) =>
{
    var computer = await db.Computers.FindAsync(id);
    if (computer is null) return Results.NotFound();

    var labExists = await db.Labs.AnyAsync(l => l.Id == input.LabId);
    if (!labExists)
    {
        return Results.BadRequest(new { message = "Gecerli bir laboratuvar seciniz." });
    }

    var studentExists = input.ResponsibleStudentId is null
        || await db.Students.AnyAsync(s => s.Id == input.ResponsibleStudentId.Value);
    if (!studentExists)
    {
        return Results.BadRequest(new { message = "Gecerli bir ogrenci seciniz." });
    }

    computer.Name = input.Name;
    computer.SerialNumber = input.SerialNumber;
    computer.Brand = input.Brand;
    computer.Processor = input.Processor;
    computer.RamGb = input.RamGb;
    computer.HasHdmi = input.HasHdmi;
    computer.HasVeyon = input.HasVeyon;
    computer.Status = input.Status;
    computer.ResponsibleStudentId = input.ResponsibleStudentId;
    if (computer.LabId != input.LabId)
    {
        computer.LabId = input.LabId;
        computer.AssetCode = await GenerateAssetCode(db, input.LabId, computer.Id);
    }
    else
    {
        computer.LabId = input.LabId;
    }
    if (input.ResponsibleStudentId.HasValue)
    {
        await EnsureStudentAccountAsync(db, input.ResponsibleStudentId.Value);
    }

    await db.SaveChangesAsync();
    return Results.NoContent();
});

computers.MapDelete("/{id:int}", async (int id, LrpDbContext db) =>
{
    var computer = await db.Computers.FindAsync(id);
    if (computer is null) return Results.NotFound();

    db.Computers.Remove(computer);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

students.MapGet("/", async (LrpDbContext db) =>
    await db.Students
        .Include(s => s.ResponsibleComputers)
        .Include(s => s.UserAccount)
        .OrderBy(s => s.StudentNumber)
        .Select(s => new
        {
            s.Id,
            s.FirstName,
            s.LastName,
            s.StudentNumber,
            s.Email,
            HasUserAccount = s.UserAccount != null,
            ResponsibleComputerCount = s.ResponsibleComputers.Count
        })
        .ToListAsync());

students.MapGet("/{id:int}", async (int id, LrpDbContext db) =>
{
    var student = await db.Students
        .Include(s => s.ResponsibleComputers)
        .ThenInclude(c => c.Lab)
        .FirstOrDefaultAsync(s => s.Id == id);

    return student is null ? Results.NotFound() : Results.Ok(student);
});

students.MapPost("/", async (Student student, LrpDbContext db) =>
{
    db.Students.Add(student);
    await db.SaveChangesAsync();
    return Results.Created($"/api/students/{student.Id}", student);
});

students.MapPut("/{id:int}", async (int id, Student input, LrpDbContext db) =>
{
    var student = await db.Students.FindAsync(id);
    if (student is null) return Results.NotFound();

    student.FirstName = input.FirstName;
    student.LastName = input.LastName;
    student.StudentNumber = input.StudentNumber;
    student.Email = input.Email;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

students.MapDelete("/{id:int}", async (int id, LrpDbContext db) =>
{
    var student = await db.Students.FindAsync(id);
    if (student is null) return Results.NotFound();

    var assignedComputerCount = await db.Computers.CountAsync(c => c.ResponsibleStudentId == id);
    if (assignedComputerCount > 0)
    {
        return Results.BadRequest(new { message = "Ogrenciye atanmis bilgisayarlar var. Once atamalari kaldirin." });
    }

    db.Students.Remove(student);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

dashboard.MapGet("/summary", async (LrpDbContext db) =>
{
    var totalLabs = await db.Labs.CountAsync();
    var totalComputers = await db.Computers.CountAsync();
    var activeComputers = await db.Computers.CountAsync(c => c.Status == ComputerStatus.Active);
    var maintenanceComputers = await db.Computers.CountAsync(c => c.Status == ComputerStatus.Maintenance);
    var totalStudents = await db.Students.CountAsync();

    return Results.Ok(new
    {
        totalLabs,
        totalComputers,
        activeComputers,
        maintenanceComputers,
        totalStudents
    });
});

static async Task<string> GenerateAssetCode(LrpDbContext db, int labId, int? currentComputerId = null)
{
    var existingCodes = await db.Computers
        .Where(c => c.LabId == labId && c.Id != currentComputerId)
        .Select(c => c.AssetCode)
        .ToListAsync();

    var nextNumber = existingCodes
        .Select(code =>
        {
            var suffix = code.Split("-PC-").LastOrDefault();
            return int.TryParse(suffix, out var number) ? number : 0;
        })
        .DefaultIfEmpty(0)
        .Max() + 1;

    return $"LAB{labId}-PC-{nextNumber:00}";
}

static async Task EnsureStudentAccountAsync(LrpDbContext db, int studentId)
{
    var existingAccount = await db.UserAccounts.AnyAsync(u => u.StudentId == studentId);
    if (existingAccount)
    {
        return;
    }

    var student = await db.Students.FindAsync(studentId);
    if (student is null)
    {
        return;
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

app.Run();

record LoginRequest(string Username, string Password);
