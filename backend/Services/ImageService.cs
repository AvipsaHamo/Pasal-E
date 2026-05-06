using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace PasalE.Api.Services;

public interface IImageService
{
    Task<string> UploadImageAsync(IFormFile file, string containerName);
    Task<bool> DeleteImageAsync(string blobName, string containerName);
}


public class ImageService : IImageService
{
    private readonly BlobContainerClient _containerClient;
    private readonly ILogger<ImageService> _logger;

    public ImageService(ILogger<ImageService> logger)
    {
        _logger = logger;
        
        var connectionString = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING")
            ?? throw new InvalidOperationException("AZURE_STORAGE_CONNECTION_STRING not set.");
        var containerName = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONTAINER")
            ?? throw new InvalidOperationException("AZURE_STORAGE_CONTAINER not set.");

        var blobServiceClient = new BlobServiceClient(connectionString);
        _containerClient = blobServiceClient.GetBlobContainerClient(containerName);
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folderName = "")
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty.");

        // Generate unique blob name
        var extension = Path.GetExtension(file.FileName);
        var blobName = $"{folderName}/{Guid.NewGuid()}{extension}".TrimStart('/');

        try
        {
            var blobClient = _containerClient.GetBlobClient(blobName);

            using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, overwrite: true);
            }

            _logger.LogInformation($"Image uploaded successfully: {blobName}");
            return blobClient.Uri.AbsoluteUri;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error uploading image: {ex.Message}");
            throw;
        }
    }

    public async Task<bool> DeleteImageAsync(string blobName, string folderName = "")
    {
        try
        {
            var fullBlobName = $"{folderName}/{blobName}".TrimStart('/');
            var blobClient = _containerClient.GetBlobClient(fullBlobName);
            await blobClient.DeleteAsync();
            
            _logger.LogInformation($"Image deleted successfully: {fullBlobName}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting image: {ex.Message}");
            return false;
        }
    }
}
