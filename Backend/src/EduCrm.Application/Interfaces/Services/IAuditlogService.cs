using EduCrm.Application.Common;
using EduCrm.Application.DTOs.AuditLog.Request;
using EduCrm.Application.DTOs.AuditLog.Response;

namespace EduCrm.Application.Interfaces.Services;

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