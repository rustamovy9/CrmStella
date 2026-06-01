namespace EduCrm.Domain.Entities;

public class GroupStudent
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public int StudentId { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LeftAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? RemoveReason { get; set; }
    public decimal DiscountPercent { get; set; } = 0;

    public int? TransferredFromGroupStudentId { get; set; }
    public int? TransferredToGroupStudentId { get; set; }

    public Group Group { get; set; } = null!;
    public Student Student { get; set; } = null!;
    
    public DateTime? LastBilledAt { get; set; }     
    public DateTime? NextBillingDate { get; set; }

    public GroupStudent? TransferredFrom { get; set; }
    public GroupStudent? TransferredTo { get; set; }
}