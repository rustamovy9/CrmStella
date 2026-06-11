namespace CrmStella.Application.DTOs.Group.Request;

public class GroupQueryRequest
{
    public string? Search { get; set; }
    public int? CourseId { get; set; }
    public int? MentorId { get; set; }
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}