using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Schedule.Request;
using EduCrm.Application.DTOs.Schedule.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IScheduleService
{
    Task<Result<List<ScheduleResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<List<ScheduleResponse>>> GetByGroupIdAsync(int groupId, CancellationToken cancellationToken = default);
    Task<Result<ScheduleResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Result<ScheduleResponse>> CreateAsync(CreateScheduleRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<ScheduleResponse>> UpdateAsync(int id, UpdateScheduleRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}