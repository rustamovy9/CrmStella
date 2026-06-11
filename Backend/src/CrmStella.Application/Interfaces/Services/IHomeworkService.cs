using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Homework.Request;
using CrmStella.Application.DTOs.Homework.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IHomeworkService
{
    Task<Result<List<HomeworkListItemResponse>>> GetAllAsync();

    Task<Result<List<HomeworkListItemResponse>>> GetByLessonAsync(int lessonId);

    Task<Result<HomeworkResponse>> GetByIdAsync(int id);

    Task<Result<HomeworkResponse>> CreateAsync(CreateHomeworkRequest request);

    Task<Result<HomeworkResponse>> UpdateAsync(int id, UpdateHomeworkRequest request);

    Task<Result<bool>> DeleteAsync(int id);

    Task<Result<bool>> SetStatusAsync(int id, SetHomeworkStatusRequest request);
}