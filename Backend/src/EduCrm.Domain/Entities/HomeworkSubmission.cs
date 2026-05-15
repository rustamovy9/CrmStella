namespace EduCrm.Domain.Entities;

public class HomeworkSubmission
{
    public int Id { get; set; }

    public int HomeworkId { get; set; }
    public int StudentId { get; set; }

    public string? TextAnswer { get; set; }
    public string? FileUrl { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public bool IsLate { get; set; } = false;

    public Homework Homework { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public LessonScore? LessonScore { get; set; }
}