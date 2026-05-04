namespace CelalProje.Models;

public class Computer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AssetCode { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Processor { get; set; } = string.Empty;
    public int RamGb { get; set; }
    public bool HasHdmi { get; set; }
    public bool HasVeyon { get; set; }
    public ComputerStatus Status { get; set; } = ComputerStatus.Active;
    public int LabId { get; set; }
    public Lab? Lab { get; set; }
    public int? ResponsibleStudentId { get; set; }
    public Student? ResponsibleStudent { get; set; }
}
