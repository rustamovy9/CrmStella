using EduCrm.Domain.Entities;

namespace EduCrm.Application.DTOs.Lead.Response;

public class LeadActivityResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; } = null!;
    public string UserFullName { get; set; } = "";
    public string Type { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}