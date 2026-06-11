namespace CrmStella.Application.DTOs.Lesson.Response;

public class LessonResponse
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string GroupName { get; set; } = null!;
    public int WeekNumber { get; set; }
    public int OrderIndex { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime LessonDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}