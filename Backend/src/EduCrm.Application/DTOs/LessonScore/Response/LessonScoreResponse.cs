namespace EduCrm.Application.DTOs.LessonScore.Response;

public class LessonScoreResponse
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string LessonTitle { get; set; } = null!;
    public int StudentId { get; set; }
    public string StudentName { get; set; } = null!;
    public int? HomeworkSubmissionId { get; set; }
    public decimal Score { get; set; }
    public string? MentorFeedback { get; set; }
    public int? ScoredByMentorId { get; set; }
    public string? ScoredByMentorName { get; set; }
    public DateTime ScoredAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}