using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Lesson.Request;
using EduCrm.Application.DTOs.Lesson.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface ILessonService
{
    Task<Result<List<LessonResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<LessonResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<List<LessonResponse>>> GetByGroupIdAsync(int groupId, CancellationToken cancellationToken = default);
    Task<Result<LessonResponse>> CreateAsync(CreateLessonRequest dto, CancellationToken cancellationToken = default);
    Task<Result<LessonResponse>> UpdateAsync(UpdateLessonRequest dto, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}