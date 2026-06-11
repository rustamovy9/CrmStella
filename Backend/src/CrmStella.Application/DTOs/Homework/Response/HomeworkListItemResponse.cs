namespace CrmStella.Application.DTOs.Homework.Response;

public class HomeworkListItemResponse
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string LessonTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public int MaxScore { get; set; }
    public bool IsActive { get; set; }
    public bool IsOverdue { get; set; }
}