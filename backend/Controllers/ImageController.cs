using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PasalE.Api.DTOs;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;

namespace PasalE.Api.Controllers;

[ApiController]
[Route("api/images")]
[AllowAnonymous]
public class ImageController : ControllerBase
{
    private readonly string _connectionString;
    private readonly string _containerName;
    private readonly ILogger<ImageController> _logger;

    public ImageController(ILogger<ImageController> logger)
    {
        _logger = logger;
        _connectionString = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING") ?? "";
        _containerName    = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONTAINER")         ?? "pasal-e-images";
    }

    // POST api/images/upload
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File must be under 5 MB." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { message = "Only JPEG, PNG, WebP and GIF are allowed." });

        if (string.IsNullOrEmpty(_connectionString))
            return StatusCode(503, new { message = "Image storage not configured. Set AZURE_STORAGE_CONNECTION_STRING." });

        var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
        var blobName = $"{Guid.NewGuid()}{ext}";

        var containerClient = new BlobContainerClient(_connectionString, _containerName);
        var blob = containerClient.GetBlobClient(blobName);
        using var stream = file.OpenReadStream();
        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType });

        // Return blob name instead of direct Azure URL to avoid CORS issues
        return Ok(new ImageUploadResponse($"/api/images/{blobName}"));
    }

    // GET api/images/{blobName} - Stream image from Azure (avoids CORS)
    [HttpGet("{blobName}")]
    public async Task<IActionResult> GetImage(string blobName)
    {
        try
        {
            if (string.IsNullOrEmpty(blobName))
                return BadRequest("Blob name is required.");

            var containerClient = new BlobContainerClient(_connectionString, _containerName);
            var blob = containerClient.GetBlobClient(blobName);

            // Check if blob exists
            if (!await blob.ExistsAsync())
                return NotFound("Image not found.");

            // Download blob
            var download = await blob.DownloadAsync();

            // Return with proper content type
            return File(download.Value.Content, download.Value.Details.ContentType ?? "image/jpeg");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error retrieving image {blobName}: {ex.Message}");
            return StatusCode(500, new { message = "Failed to retrieve image." });
        }
    }

    private string GenerateSasUrl(BlobClient blob, string blobName)
    {
        try
        {
            var sasBuilder = new BlobSasBuilder(BlobSasPermissions.Read, DateTimeOffset.UtcNow.AddHours(24))
            {
                BlobContainerName = _containerName,
                BlobName = blobName
            };

            // Extract account name and key from connection string
            var parts = _connectionString.Split(';');
            string? accountName = null;
            string? accountKey = null;

            foreach (var part in parts)
            {
                if (part.StartsWith("AccountName="))
                    accountName = part.Substring("AccountName=".Length);
                else if (part.StartsWith("AccountKey="))
                    accountKey = part.Substring("AccountKey=".Length);
            }

            if (string.IsNullOrEmpty(accountName))
            {
                _logger.LogWarning("Failed to extract account name from connection string");
                return blob.Uri.ToString();
            }

            if (string.IsNullOrEmpty(accountKey))
            {
                _logger.LogWarning("Failed to extract account key from connection string");
                return blob.Uri.ToString();
            }

            var credential = new Azure.Storage.StorageSharedKeyCredential(accountName, accountKey);
            var sasToken = sasBuilder.ToSasQueryParameters(credential).ToString();
            
            var sasUrl = $"{blob.Uri}?{sasToken}";
            _logger.LogInformation($"Generated SAS URL successfully for blob: {blobName}");
            return sasUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error generating SAS URL: {ex.Message}\n{ex.StackTrace}");
            return blob.Uri.ToString();
        }
    }
}
