namespace CrmStella.Domain.Entities;

public class Course
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal MonthlyPrice { get; set; }
    public string? IconUrl { get; set; }
    public int DurationWeeks { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Group> Groups { get; set; } = new List<Group>();
}