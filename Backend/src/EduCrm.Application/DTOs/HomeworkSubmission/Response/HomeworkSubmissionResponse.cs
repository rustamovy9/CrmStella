namespace EduCrm.Application.DTOs.HomeworkSubmission.Response;

public class HomeworkSubmissionResponse
{
    public int Id { get; set; }
    public int HomeworkId { get; set; }
    public string HomeworkTitle { get; set; } = null!;
    public int StudentId { get; set; }
    public string StudentName { get; set; } = null!;
    public string? TextAnswer { get; set; }
    public string? FileUrl { get; set; }
    public DateTime SubmittedAt { get; set; }
    public bool IsLate { get; set; }
    public decimal? Score { get; set; }
    public string? Feedback { get; set; }
}