using CrmStella.Application.Common;
using CrmStella.Application.DTOs.AuditLog.Request;
using CrmStella.Application.DTOs.AuditLog.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IAuditLogService
{
    Task<Result<List<AuditLogResponse>>> QueryAsync(AuditLogQuery query);

    Task LogAsync(
        int? userId,
        string action,
        string entityName,
        int? entityId,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null);
}