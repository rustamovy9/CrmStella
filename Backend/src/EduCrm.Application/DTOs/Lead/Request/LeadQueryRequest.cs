namespace EduCrm.Application.DTOs.Lead.Request;

public class LeadQueryRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public int? Status { get; set; }
    public int? Source { get; set; }
    public int? ManagerId { get; set; }
}