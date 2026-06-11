namespace CrmStella.Application.DTOs.StudentProgress.Response;

public class StudentProgressResponse
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;

    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;

    public int TotalLessons { get; set; }
    public int AttendedLessons { get; set; }
    public decimal AttendanceRate { get; set; }

    public decimal AverageLessonScore { get; set; }
    public decimal AverageHomeworkScore { get; set; }
    public decimal TotalBonusScore { get; set; }

    public int ExamsPassed { get; set; }
    public int ExamsFailed { get; set; }

    public decimal OverallProgressPercent { get; set; }
    public bool IsRecommendedForCertificate { get; set; }

    public DateTime UpdatedAt { get; set; }
}