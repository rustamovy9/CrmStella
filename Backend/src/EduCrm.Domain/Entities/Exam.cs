namespace EduCrm.Domain.Entities;

public class Exam
{
    public int Id { get; set; }

    public int GroupId { get; set; }

    public string Title { get; set; } = null!;
    public string? Description { get; set; }

    public bool IsActive { get; set; }
    public DateTime ExamDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }

    public decimal PassScore { get; set; } = 70;
    public decimal MaxScore { get; set; } = 100;

    public int? CreatedByMentorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Group Group { get; set; } = null!;
    public Mentor? CreatedByMentor { get; set; }
    public ICollection<ExamResult> Results { get; set; } = new List<ExamResult>();
}