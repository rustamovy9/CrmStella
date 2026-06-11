using System.Security.Claims;
using CrmStella.Application.Interfaces.Services;
using CrmStella.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/files")]
[Authorize(Roles = "Admin")]
public class FilesController(IFileStorageService fileStorageService) : BaseController
{
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromQuery] FileOwnerType ownerType,
        [FromQuery] int ownerId)
    {
        // Валидация файла
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "File is required" });

        // Получаем ID пользователя
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            // FileStorageService не возвращает Result, а выбрасывает исключение
            var fileRecord = await fileStorageService.UploadAsync(
                file,
                ownerType,
                ownerId,
                userId);

            return Ok(new
            {
                success = true,
                data = new
                {
                    fileRecord.Id,
                    fileRecord.Url,
                    fileRecord.OriginalFileName,
                    fileRecord.FileSize,
                    fileRecord.MimeType
                }
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { error = "File upload failed" });
        }
    }

    [HttpDelete("{fileId:int}")]
    public async Task<IActionResult> Delete(int fileId)
    {
        try
        {
            await fileStorageService.DeleteAsync(fileId);
            return Ok(new { success = true, message = "File deleted successfully" });
        }
        catch (Exception)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { error = "Failed to delete file" });
        }
    }

    [HttpGet("owner/{ownerType}/{ownerId:int}")]
    public async Task<IActionResult> GetByOwner(FileOwnerType ownerType, int ownerId)
    {
        try
        {
            var file = await fileStorageService.GetByOwnerAsync(ownerType, ownerId);

            if (file is null)
                return NotFound(new { error = "File not found" });

            return Ok(new
            {
                success = true,
                data = new
                {
                    file.Id,
                    file.Url,
                    file.OriginalFileName,
                    file.FileSize,
                    file.MimeType
                }
            });
        }
        catch (Exception)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { error = "Failed to retrieve file" });
        }
    }
}