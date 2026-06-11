namespace CrmStella.Application.DTOs.Student.Request;

public class StudentQueryRequest
{
    public string? Search { get; set; }
    public bool? IsActive { get; set; }
    public int? GroupId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}