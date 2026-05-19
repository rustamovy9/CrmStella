namespace EduCrm.Application.DTOs.ExamResult.Response;

public class ExamResultResponse
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;

    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;

    public decimal Score { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Comment { get; set; }

    public int? ScoredByMentorId { get; set; }
    public string? ScoredByMentorName { get; set; }

    public DateTime ScoredAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}