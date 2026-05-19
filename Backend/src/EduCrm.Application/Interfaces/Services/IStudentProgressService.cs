using EduCrm.Application.Common;
using EduCrm.Application.DTOs.StudentProgress.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IStudentProgressService
{
    Task<Result<StudentProgressResponse>> GetByStudentAndGroupAsync(int studentId, int groupId);
    Task<Result<List<StudentProgressResponse>>> GetByGroupAsync(int groupId);
    Task<Result<StudentProgressResponse>> RecalculateAsync(int studentId, int groupId);
}