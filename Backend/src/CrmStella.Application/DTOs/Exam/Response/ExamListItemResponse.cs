namespace CrmStella.Application.DTOs.Exam.Response;

public class ExamListItemResponse
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime ExamDate { get; set; }
    public decimal PassScore { get; set; }
    public bool IsActive { get; set; }
    public bool IsFinished { get; set; }
}