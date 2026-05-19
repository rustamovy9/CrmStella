using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Homework.Request;
using EduCrm.Application.DTOs.Homework.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IHomeworkService
{
    Task<Result<List<HomeworkListItemResponse>>> GetAllAsync();
    Task<Result<List<HomeworkListItemResponse>>> GetByLessonAsync(int lessonId);
    Task<Result<HomeworkResponse>> GetByIdAsync(int id);
    Task<Result<HomeworkResponse>> CreateAsync(CreateHomeworkRequest request);
    Task<Result<HomeworkResponse>> UpdateAsync(int id, UpdateHomeworkRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetHomeworkStatusRequest request);
}