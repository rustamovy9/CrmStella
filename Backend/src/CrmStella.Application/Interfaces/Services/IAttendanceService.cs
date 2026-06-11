using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Attendance.Request;
using CrmStella.Application.DTOs.Attendance.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IAttendanceService
{
    public Task<Result<AttendanceSummaryResponse>> GetSummaryAsync(
        DateTime date, CancellationToken ct = default);

    Task<Result<List<AttendanceListItemResponse>>> GetByLessonIdAsync(int lessonId,
        CancellationToken cancellationToken = default);

    Task<Result<List<AttendanceListItemResponse>>> GetByStudentIdAsync(int studentId,
        CancellationToken cancellationToken = default);

    Task<Result<AttendanceResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Result<AttendanceResponse>> CreateAsync(
        CreateAttendanceRequest request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<Result<List<AttendanceResponse>>> BulkCreateAsync(
        BulkCreateAttendanceRequest request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<Result<AttendanceResponse>> UpdateAsync(int id, UpdateAttendanceRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}