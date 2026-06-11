namespace CrmStella.Application.DTOs.Exam.Response;

public class ExamResponse
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ExamDate { get; set; }
    public decimal MaxScore { get; set; }
    public decimal PassScore { get; set; }
    public bool IsActive { get; set; }
    public bool IsFinished { get; set; }

    public DateTime CreatedAt { get; set; }
}