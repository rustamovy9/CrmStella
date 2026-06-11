using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Schedule.Request;
using CrmStella.Application.DTOs.Schedule.Response;
using CrmStella.Application.Interfaces.Repositories;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Constants;
using CrmStella.Domain.Entities;
using CrmStella.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CrmStella.Application.Services;

public class ScheduleService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    ILogger<ScheduleService> logger) : IScheduleService
{
    private const string AllSchedulesCacheKey = "schedules:all";
    private const string ScheduleCachePrefix = "schedules:";

    public async Task<Result<PagedResult<ScheduleResponse>>> GetAllAsync(
        GetSchedulesQuery query,
        CancellationToken cancellationToken = default)
    {
        // Кэш только без фильтров
        if (query.Page == 1 && string.IsNullOrEmpty(query.Search) &&
            query.DayOfWeek == null && query.GroupId == null)
        {
            var cached = await cache.GetAsync<PagedResult<ScheduleResponse>>(AllSchedulesCacheKey);
            if (cached is not null)
                return Result<PagedResult<ScheduleResponse>>.Ok(cached);
        }

        var (items, totalCount) = await unitOfWork.Schedules.GetAllAsync(
            query.Page,
            query.PageSize,
            query.Search,
            query.DayOfWeek,
            query.GroupId,
            cancellationToken);

        var result = new PagedResult<ScheduleResponse>
        {
            Items = items.Select(MapToResponse).ToList(),
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };

        // Кэшируем только первую страницу без фильтров
        if (query.Page == 1 && string.IsNullOrEmpty(query.Search) &&
            query.DayOfWeek == null && query.GroupId == null)
            await cache.SetAsync(AllSchedulesCacheKey, result, TimeSpan.FromMinutes(10));

        return Result<PagedResult<ScheduleResponse>>.Ok(result);
    }

    public async Task<Result<List<ScheduleResponse>>> GetByGroupIdAsync(
        int groupId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"schedules:group:{groupId}";

        var cached = await cache.GetAsync<List<ScheduleResponse>>(cacheKey);
        if (cached is not null)
            return Result<List<ScheduleResponse>>.Ok(cached);

        var schedules = await unitOfWork.Schedules.GetByGroupIdAsync(groupId, cancellationToken);
        var response = schedules.Select(MapToResponse).ToList();

        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(10));

        return Result<List<ScheduleResponse>>.Ok(response);
    }

    public async Task<Result<ScheduleResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"schedules:{id}";

        var cached = await cache.GetAsync<ScheduleResponse>(cacheKey);
        if (cached is not null)
            return Result<ScheduleResponse>.Ok(cached);

        var schedule = await unitOfWork.Schedules.GetByIdAsync(id, cancellationToken);
        if (schedule is null)
        {
            logger.LogWarning("Schedule not found: {ScheduleId}", id);
            return Result<ScheduleResponse>.Fail("Schedule not found");
        }

        var response = MapToResponse(schedule);
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(10));

        return Result<ScheduleResponse>.Ok(response);
    }

    public async Task<Result<ScheduleResponse>> CreateAsync(
        CreateScheduleRequest request,
        CancellationToken cancellationToken = default)
    {
        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId, cancellationToken);
        if (group is null)
            return Result<ScheduleResponse>.Fail("Group not found");

        var exists = await unitOfWork.Schedules.ExistsAsync(
            request.GroupId,
            request.DayOfWeek,
            cancellationToken);

        if (exists)
            return Result<ScheduleResponse>.Fail(
                "Schedule already exists for this day",
                ErrorType.Conflict);

        if (request.StartTime >= request.EndTime)
            return Result<ScheduleResponse>.Fail(
                "StartTime must be before EndTime",
                ErrorType.BadRequest);

        var schedule = new Schedule
        {
            GroupId = request.GroupId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Room = request.Room?.Trim(),
            RecurringFrom = DateTime.SpecifyKind(request.RecurringFrom, DateTimeKind.Utc),
            RecurringTo = request.RecurringTo.HasValue
                ? DateTime.SpecifyKind(request.RecurringTo.Value, DateTimeKind.Utc)
                : null
        };

        await unitOfWork.Schedules.CreateAsync(schedule, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            null,
            AuditActions.CreateSchedule,
            nameof(Schedule),
            schedule.Id,
            newValues: request
        );

        await cache.RemoveByPrefixAsync(ScheduleCachePrefix);

        var created = await unitOfWork.Schedules.GetByIdAsync(schedule.Id, cancellationToken);
        return Result<ScheduleResponse>.Ok(MapToResponse(created!));
    }

    public async Task<Result<ScheduleResponse>> UpdateAsync(
        int id,
        UpdateScheduleRequest request,
        CancellationToken cancellationToken = default)
    {
        var schedule = await unitOfWork.Schedules.GetByIdAsync(id, cancellationToken);
        if (schedule is null)
            return Result<ScheduleResponse>.Fail("Schedule not found");

        if (request.StartTime >= request.EndTime)
            return Result<ScheduleResponse>.Fail(
                "StartTime must be before EndTime",
                ErrorType.BadRequest);

        if (request.RecurringTo.HasValue && request.RecurringTo.Value < schedule.RecurringFrom)
            return Result<ScheduleResponse>.Fail(
                "Дата окончания (RecurringTo) не может быть раньше даты начала занятия.",
                ErrorType.BadRequest);

        var oldValues = new
        {
            schedule.DayOfWeek,
            schedule.StartTime,
            schedule.EndTime,
            schedule.Room,
            schedule.RecurringTo
        };

        schedule.DayOfWeek = request.DayOfWeek;
        schedule.StartTime = request.StartTime;
        schedule.EndTime = request.EndTime;
        schedule.Room = request.Room?.Trim();
        schedule.RecurringTo = request.RecurringTo.HasValue
            ? DateTime.SpecifyKind(request.RecurringTo.Value, DateTimeKind.Utc)
            : null;

        await unitOfWork.Schedules.UpdateAsync(schedule, cancellationToken); // ← ключевая строка

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            var dbErrorMessage = ex.InnerException?.Message ?? ex.Message;
            return Result<ScheduleResponse>.Fail($"Ошибка БД при сохранении: {dbErrorMessage}");
        }

        await auditLogService.LogAsync(
            null,
            AuditActions.UpdateSchedule,
            nameof(Schedule),
            schedule.Id,
            oldValues,
            request
        );

        await cache.RemoveByPrefixAsync(ScheduleCachePrefix);

        // Перечитываем из БД чтобы вернуть актуальные данные с навигационными свойствами
        var updated = await unitOfWork.Schedules.GetByIdAsync(schedule.Id, cancellationToken);
        return Result<ScheduleResponse>.Ok(MapToResponse(updated!));
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var schedule = await unitOfWork.Schedules.GetByIdAsync(id, cancellationToken);
        if (schedule is null)
            return Result<bool>.Fail("Schedule not found");

        var oldValues = schedule;

        await unitOfWork.Schedules.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await auditLogService.LogAsync(
            null,
            AuditActions.DeleteSchedule,
            nameof(Schedule),
            id,
            oldValues
        );

        await cache.RemoveByPrefixAsync(ScheduleCachePrefix);

        return Result<bool>.Ok(true);
    }

    private static ScheduleResponse MapToResponse(Schedule s)
    {
        return new ScheduleResponse
        {
            Id = s.Id,
            GroupId = s.GroupId,
            GroupName = s.Group?.Name ?? string.Empty,
            DayOfWeek = s.DayOfWeek.ToString(),
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            Room = s.Room,
            RecurringFrom = s.RecurringFrom,
            RecurringTo = s.RecurringTo
        };
    }
}