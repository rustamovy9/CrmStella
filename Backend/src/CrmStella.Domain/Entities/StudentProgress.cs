namespace CrmStella.Domain.Entities;

public class StudentProgress
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public int GroupId { get; set; }

    public int TotalLessons { get; set; } = 0;
    public int AttendedLessons { get; set; } = 0;
    public decimal AttendanceRate { get; set; } = 0;

    public decimal AverageLessonScore { get; set; } = 0;
    public decimal AverageHomeworkScore { get; set; } = 0;
    public decimal TotalBonusScore { get; set; } = 0;

    public int ExamsPassed { get; set; } = 0;
    public int ExamsFailed { get; set; } = 0;

    public decimal OverallProgressPercent { get; set; } = 0;
    public bool IsRecommendedForCertificate { get; set; } = false;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Student Student { get; set; } = null!;
    public Group Group { get; set; } = null!;
}