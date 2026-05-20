using EduCrm.Application.Common;
using EduCrm.Application.DTOs.AuditLog.Request;
using EduCrm.Application.DTOs.AuditLog.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IAuditLogService
{
    // ЧТЕНИЕ — для админа
    Task<Result<List<AuditLogResponse>>> QueryAsync(AuditLogQuery query);

    // ЗАПИСЬ — вызывается ДРУГИМИ сервисами, не из контроллера
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