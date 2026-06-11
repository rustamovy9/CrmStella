namespace CrmStella.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public string Action { get; set; } = null!;
    public string EntityName { get; set; } = null!;
    public int? EntityId { get; set; }

    public string? OldValues { get; set; }
    public string? NewValues { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}