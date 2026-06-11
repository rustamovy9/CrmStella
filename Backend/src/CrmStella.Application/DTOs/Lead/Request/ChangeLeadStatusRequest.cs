namespace CrmStella.Application.DTOs.Lead.Request;

public class ChangeLeadStatusRequest
{
    public int Status { get; set; }
    public string? Comment { get; set; }
    public string? LostReason { get; set; }
}