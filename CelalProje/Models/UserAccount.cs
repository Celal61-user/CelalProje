namespace CelalProje.Models;

public class UserAccount
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int? StudentId { get; set; }
    public Student? Student { get; set; }
}
