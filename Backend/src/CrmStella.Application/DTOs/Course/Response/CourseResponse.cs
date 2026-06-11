namespace CrmStella.Application.DTOs.Course.Response;

public class CourseResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? IconUrl { get; set; }
    public int DurationWeeks { get; set; }
    public bool IsActive { get; set; }

    public int GroupsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}