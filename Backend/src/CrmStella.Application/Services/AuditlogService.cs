using System.Text.Json;
using CrmStella.Application.Common;
using CrmStella.Application.DTOs.AuditLog.Request;
using CrmStella.Application.DTOs.AuditLog.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class AuditLogService(
    IUnitOfWork unitOfWork,
    ILogger<AuditLogService> logger) : IAuditLogService
{
    public async Task<Result<List<AuditLogResponse>>> QueryAsync(AuditLogQuery query)
    {
        var pageSize = query.PageSize is < 1 or > 200 ? 50 : query.PageSize;
        var page = query.Page < 1 ? 1 : query.Page;

        var fromDate = NormalizeToUtc(query.FromDate);
        var toDate = query.ToDate.HasValue
            ? NormalizeToUtc(query.ToDate.Value.Date.AddDays(1).AddTicks(-1))
            : null;

        var logs = await unitOfWork.AuditLogs.QueryAsync(
            query.UserId,
            query.EntityName,
            query.EntityId,
            fromDate,
            toDate,
            page,
            pageSize);

        var result = logs.Select(a => new AuditLogResponse
        {
            Id = a.Id,
            UserId = a.UserId,
            UserName = a.User?.FullName,
            Action = a.Action,
            EntityName = a.EntityName,
            EntityId = a.EntityId,
            OldValues = a.OldValues,
            NewValues = a.NewValues,
            IpAddress = a.IpAddress,
            CreatedAt = a.CreatedAt
        }).ToList();

        return Result<List<AuditLogResponse>>.Ok(result);
    }

    public async Task LogAsync(
        int? userId,
        string action,
        string entityName,
        int? entityId,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        try
        {
            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                OldValues = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
                NewValues = newValues is null ? null : JsonSerializer.Serialize(newValues),
                IpAddress = ipAddress,
                UserAgent = userAgent,
                CreatedAt = DateTime.UtcNow
            };

            await unitOfWork.AuditLogs.CreateAsync(log);
            await unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to write audit log: {Action} {Entity} {EntityId}",
                action, entityName, entityId);
        }
    }

    private static DateTime? NormalizeToUtc(DateTime? value)
    {
        if (!value.HasValue) return null;

        return value.Value.Kind switch
        {
            DateTimeKind.Utc => value.Value,
            // дата без зоны (как из <input type="date">) — трактуем как UTC
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc),
            // если вдруг пришло локальное — конвертируем
            DateTimeKind.Local => value.Value.ToUniversalTime(),
            _ => value.Value
        };
    }
}