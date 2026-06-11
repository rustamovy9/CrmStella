namespace CrmStella.Application.DTOs.WeekResult.Response;

public class WeekResultResponse
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;

    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;

    public int WeekNumber { get; set; }

    public decimal LessonAverageScore { get; set; }
    public decimal HomeworkAverageScore { get; set; }
    public decimal AttendanceScore { get; set; }
    public decimal BonusScore { get; set; }
    public decimal ExamScore { get; set; }
    public decimal TotalScore { get; set; }

    public string? MentorComment { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}