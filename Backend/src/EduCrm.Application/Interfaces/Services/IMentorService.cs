using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Mentor.Request;
using EduCrm.Application.DTOs.Mentor.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IMentorService
{
    Task<Result<List<MentorListItemResponse>>> GetAllAsync();
    Task<Result<MentorResponse>> GetByIdAsync(int id);
    Task<Result<MentorResponse>> UpdateAsync(int id, UpdateMentorRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetMentorStatusRequest request);
}