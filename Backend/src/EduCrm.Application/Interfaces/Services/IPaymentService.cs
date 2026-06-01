using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Payment.Request;
using EduCrm.Application.DTOs.Payment.Response;
using Microsoft.AspNetCore.Http;

namespace EduCrm.Application.Interfaces.Services;

public interface IPaymentService
{
    Task<Result<List<PaymentListItemResponse>>> GetAllAsync();
    public Task<Result<FinanceDashboardResponse>> GetFinanceDashboardAsync();
    Task<Result<List<PaymentListItemResponse>>> GetByStudentIdAsync(int studentId);
    Task<Result<List<PaymentListItemResponse>>> GetByGroupIdAsync(int groupId);
    Task<Result<PaymentResponse>> GetByIdAsync(int id);
    Task<Result<StudentBalanceResponse>> GetStudentBalanceAsync(int studentId);
    Task<Result<int>> RecalculateAllBalancesAsync();
    public Task<Result<PaymentResponse>> TopUpAsync(
        TopUpRequest request, int createdByUserId);
    Task<Result<PaymentResponse>> CreateAsync(CreatePaymentRequest request, int createdByUserId);
    Task<Result<PaymentResponse>> UpdateAsync(int id, UpdatePaymentRequest request);
    Task<Result<bool>> ConfirmAsync(int id, ConfirmPaymentRequest request);
    Task<Result<PaymentResponse>> SetReceiptAsync(int paymentId, IFormFile receiptFile, int uploadedByUserId);
    Task<Result<bool>> DeleteAsync(int id);
}