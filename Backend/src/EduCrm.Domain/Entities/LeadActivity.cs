namespace EduCrm.Domain.Entities;

public class LeadActivity
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public Lead Lead { get; set; } = null!;
    public int UserId { get; set; }   
    public User? User { get; set; }  
    public string Type { get; set; } = ""; 
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}