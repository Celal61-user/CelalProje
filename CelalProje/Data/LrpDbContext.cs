using CelalProje.Models;
using Microsoft.EntityFrameworkCore;

namespace CelalProje.Data;

public class LrpDbContext(DbContextOptions<LrpDbContext> options) : DbContext(options)
{
    public DbSet<Lab> Labs => Set<Lab>();
    public DbSet<Computer> Computers => Set<Computer>();
    public DbSet<Student> Students => Set<Student>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Lab>()
            .Property(l => l.Name)
            .HasMaxLength(100);

        modelBuilder.Entity<Computer>()
            .Property(c => c.Name)
            .HasMaxLength(100);

        modelBuilder.Entity<Computer>()
            .Property(c => c.AssetCode)
            .HasMaxLength(50);

        modelBuilder.Entity<Computer>()
            .Property(c => c.SerialNumber)
            .HasMaxLength(100);

        modelBuilder.Entity<Computer>()
            .Property(c => c.Brand)
            .HasMaxLength(100);

        modelBuilder.Entity<Computer>()
            .Property(c => c.Processor)
            .HasMaxLength(100);

        modelBuilder.Entity<Student>()
            .Property(s => s.FirstName)
            .HasMaxLength(50);

        modelBuilder.Entity<Student>()
            .Property(s => s.LastName)
            .HasMaxLength(50);

        modelBuilder.Entity<Student>()
            .Property(s => s.StudentNumber)
            .HasMaxLength(20);

        modelBuilder.Entity<Student>()
            .HasIndex(s => s.StudentNumber)
            .IsUnique();

        modelBuilder.Entity<Computer>()
            .HasIndex(c => c.SerialNumber)
            .IsUnique();

        modelBuilder.Entity<Computer>()
            .HasIndex(c => c.AssetCode)
            .IsUnique();

        modelBuilder.Entity<Computer>()
            .HasOne(c => c.Lab)
            .WithMany(l => l.Computers)
            .HasForeignKey(c => c.LabId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Computer>()
            .HasOne(c => c.ResponsibleStudent)
            .WithMany(s => s.ResponsibleComputers)
            .HasForeignKey(c => c.ResponsibleStudentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
