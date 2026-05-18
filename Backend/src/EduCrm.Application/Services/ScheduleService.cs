using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Schedule.Request;
using EduCrm.Application.DTOs.Schedule.Response;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class ScheduleService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ILogger<ScheduleService> logger) : IScheduleService
{
    private const string AllSchedulesCacheKey = "schedules:all";
    private const string ScheduleCachePrefix = "schedules:";

    public async Task<Result<List<ScheduleResponse>>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetAsync<List<ScheduleResponse>>(AllSchedulesCacheKey);
        if (cached is not null)
        {
            logger.LogInformation("Schedules served from cache");
            return Result<List<ScheduleResponse>>.Ok(cached);
        }

        var schedules = await unitOfWork.Schedules.GetAllAsync(cancellationToken);
        var response = schedules.Select(MapToResponse).ToList();

        await cache.SetAsync(AllSchedulesCacheKey, response, TimeSpan.FromMinutes(10));

        logger.LogInformation("GetAllSchedules - returned {Count} from database", response.Count);

        return Result<List<ScheduleResponse>>.Ok(response);
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
        // проверяем группу
        var group = await unitOfWork.Groups.GetByIdAsync(request.GroupId, cancellationToken);
        if (group is null)
        {
            logger.LogWarning("CreateSchedule failed - group not found: {GroupId}", request.GroupId);
            return Result<ScheduleResponse>.Fail("Group not found");
        }

        // проверяем что нет расписания для этого дня
        var exists = await unitOfWork.Schedules.ExistsAsync(
            request.GroupId, request.DayOfWeek, cancellationToken);

        if (exists)
        {
            logger.LogWarning(
                "CreateSchedule failed - already exists: Group {GroupId} Day {Day}",
                request.GroupId, request.DayOfWeek);
            return Result<ScheduleResponse>.Fail(
                "Schedule already exists for this day", ErrorType.Conflict);
        }

        // валидация времени
        if (request.StartTime >= request.EndTime)
            return Result<ScheduleResponse>.Fail(
                "StartTime must be before EndTime", ErrorType.BadRequest);

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

        await cache.RemoveByPrefixAsync(ScheduleCachePrefix);

        logger.LogInformation(
            "Schedule created: {ScheduleId} Group: {GroupId} Day: {Day}",
            schedule.Id, schedule.GroupId, schedule.DayOfWeek);

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
        {
            logger.LogWarning("UpdateSchedule failed - not found: {ScheduleId}", id);
            return Result<ScheduleResponse>.Fail("Schedule not found");
        }

        if (request.StartTime >= request.EndTime)
            return Result<ScheduleResponse>.Fail(
                "StartTime must be before EndTime", ErrorType.BadRequest);

        schedule.DayOfWeek = request.DayOfWeek;
        schedule.StartTime = request.StartTime;
        schedule.EndTime = request.EndTime;
        schedule.Room = request.Room?.Trim();
        schedule.RecurringTo = request.RecurringTo;

        await unitOfWork.Schedules.UpdateAsync(schedule, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(ScheduleCachePrefix);

        logger.LogInformation("Schedule updated: {ScheduleId}", id);

        return Result<ScheduleResponse>.Ok(MapToResponse(schedule));
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var schedule = await unitOfWork.Schedules.GetByIdAsync(id, cancellationToken);
        if (schedule is null)
        {
            logger.LogWarning("DeleteSchedule failed - not found: {ScheduleId}", id);
            return Result<bool>.Fail("Schedule not found");
        }

        await unitOfWork.Schedules.DeleteAsync(id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await cache.RemoveByPrefixAsync(ScheduleCachePrefix);

        logger.LogInformation("Schedule deleted: {ScheduleId}", id);

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