using CrmStella.Application.Common;
using CrmStella.Application.DTOs.StudentProgress.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IStudentProgressService
{
    Task<Result<StudentProgressResponse>> GetByStudentAndGroupAsync(int studentId, int groupId);
    Task<Result<List<StudentProgressResponse>>> GetByGroupAsync(int groupId);
    Task<Result<StudentProgressResponse>> RecalculateAsync(int studentId, int groupId);
}