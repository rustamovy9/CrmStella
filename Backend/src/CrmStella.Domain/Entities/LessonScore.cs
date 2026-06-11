namespace CrmStella.Domain.Entities;

public class LessonScore
{
    public int Id { get; set; }

    public int LessonId { get; set; }
    public int StudentId { get; set; }
    public int? HomeworkSubmissionId { get; set; }

    public decimal Score { get; set; }
    public string? MentorFeedback { get; set; }

    public int? ScoredByMentorId { get; set; }
    public DateTime ScoredAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Lesson Lesson { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public HomeworkSubmission? HomeworkSubmission { get; set; }
    public Mentor? ScoredByMentor { get; set; }
}