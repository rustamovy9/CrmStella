using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Homework.Request;
using EduCrm.Application.DTOs.Homework.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IHomeworkService
{
    Task<Result<List<HomeworkResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<HomeworkResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<List<HomeworkResponse>>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default);
    Task<Result<HomeworkResponse>> CreateAsync(CreateHomeworkRequest request, CancellationToken cancellationToken = default);
    Task<Result<HomeworkResponse>> UpdateAsync(HomeworkUpdateRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}