namespace CrmStella.Application.DTOs.Lead.Response;

public class LeadDetailsResponse : LeadResponse
{
    public List<LeadActivityResponse> Activities { get; set; } = new();
}