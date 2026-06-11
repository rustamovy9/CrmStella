namespace CrmStella.Domain.Entities;

public class Homework
{
    public int Id { get; set; }

    public int LessonId { get; set; }

    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string? FileUrl { get; set; }

    public DateTime Deadline { get; set; }
    public int MaxScore { get; set; } = 100;
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Lesson Lesson { get; set; } = null!;
    public ICollection<HomeworkSubmission> Submissions { get; set; } = new List<HomeworkSubmission>();
}