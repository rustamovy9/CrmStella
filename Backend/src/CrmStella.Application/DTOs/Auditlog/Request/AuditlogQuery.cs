namespace CrmStella.Application.DTOs.AuditLog.Request;

public class AuditLogQuery
{
    public int? UserId { get; set; }
    public string? EntityName { get; set; }
    public int? EntityId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}