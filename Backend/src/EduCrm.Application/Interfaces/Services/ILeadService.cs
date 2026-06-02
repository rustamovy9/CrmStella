using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Lead.Request;
using EduCrm.Application.DTOs.Lead.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface ILeadService
{
    Task<Result<PagedResult<LeadResponse>>> GetAllAsync(LeadQueryRequest query);
    Task<Result<LeadDetailsResponse>> GetByIdAsync(int id);
    Task<Result<LeadResponse>> CreateAsync(CreateLeadRequest request, int userId);
    Task<Result<LeadResponse>> UpdateAsync(int id, UpdateLeadRequest request, int userId);
    Task<Result<LeadResponse>> ChangeStatusAsync(int id, ChangeLeadStatusRequest request, int userId);
    Task<Result<LeadResponse>> AssignManagerAsync(int id, AssignLeadManagerRequest request, int userId);
    Task<Result<LeadActivityResponse>> AddActivityAsync(int id, CreateLeadActivityRequest request, int userId);
    Task<Result<bool>> DeleteAsync(int id, int userId);
}