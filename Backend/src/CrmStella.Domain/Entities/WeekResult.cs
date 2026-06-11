namespace CrmStella.Domain.Entities;

public class WeekResult
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public int GroupId { get; set; }
    public int WeekNumber { get; set; }

    public decimal LessonAverageScore { get; set; } = 0;
    public decimal HomeworkAverageScore { get; set; } = 0;
    public decimal AttendanceScore { get; set; } = 0;
    public decimal BonusScore { get; set; } = 0;
    public decimal ExamScore { get; set; } = 0;
    public decimal TotalScore { get; set; } = 0;

    public string? MentorComment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Student Student { get; set; } = null!;
    public Group Group { get; set; } = null!;
}