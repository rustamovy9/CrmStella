using EduCrm.Application.Common;
using EduCrm.Application.DTOs.LessonScore.Request;
using EduCrm.Application.DTOs.LessonScore.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface ILessonScoreService
{
    Task<Result<List<LessonScoreResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<LessonScoreResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<List<LessonScoreResponse>>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default);
    Task<Result<List<LessonScoreResponse>>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default);
    Task<Result<LessonScoreResponse>> CreateAsync(CreateLessonScoreRequest request, CancellationToken cancellationToken = default);
    Task<Result<LessonScoreResponse>> UpdateAsync(UpdateLessonScoreRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}