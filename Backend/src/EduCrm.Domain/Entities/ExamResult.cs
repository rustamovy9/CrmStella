using EduCrm.Domain.Enums;

namespace EduCrm.Domain.Entities;

public class ExamResult
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public int StudentId { get; set; }

    public decimal Score { get; set; }
    public ExamResultStatus Status { get; set; }

    public string? Comment { get; set; }
    public int? ScoredByMentorId { get; set; }
    public DateTime ScoredAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Exam Exam { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Mentor? ScoredByMentor { get; set; }
}