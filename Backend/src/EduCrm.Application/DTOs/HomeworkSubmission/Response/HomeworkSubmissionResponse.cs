namespace EduCrm.Application.DTOs.HomeworkSubmission.Response;

public class HomeworkSubmissionResponse
{
    public int Id { get; set; }

    public int HomeworkId { get; set; }
    public string HomeworkTitle { get; set; } = string.Empty;

    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;

    public string? TextAnswer { get; set; }
    public string? FileUrl { get; set; }

    public DateTime SubmittedAt { get; set; }
    public bool IsLate { get; set; }
}