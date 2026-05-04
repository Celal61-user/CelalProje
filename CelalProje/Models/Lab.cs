namespace CelalProje.Models;

public class Lab
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public List<Computer> Computers { get; set; } = [];
}
