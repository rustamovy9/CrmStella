namespace EduCrm.Application.DTOs.Homework.Response;

public class HomeworkResponse
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string LessonTitle { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string? FileUrl { get; set; }
    public DateTime Deadline { get; set; }
    public int MaxScore { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int SubmissionsCount { get; set; }
}