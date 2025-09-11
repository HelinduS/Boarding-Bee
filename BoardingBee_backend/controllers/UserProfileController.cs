using BoardingBee_backend.Controllers.Dto;
using BoardingBee_backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/users/{userId:int}/profile")]
    public class UserProfileController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public UserProfileController(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        // GET api/users/{userId}/profile
        [HttpGet]
        public async Task<ActionResult<ProfileResponse>> Get(int userId)
        {
            var user = await _db.Users
                .Include(u => u.UserProfile)
                .Include(u => u.UserSettings)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            // Ensure related rows exist for new users
            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile { UserId = user.Id };
                _db.UserProfiles.Add(user.UserProfile);
            }
            if (user.UserSettings == null)
            {
                user.UserSettings = new UserSettings { UserId = user.Id };
                _db.UserSettings.Add(user.UserSettings);
            }
            await _db.SaveChangesAsync();

            return Ok(ToResponse(user));
        }

        // PUT api/users/{userId}/profile
        [HttpPut]
        public async Task<ActionResult<ProfileResponse>> Update(int userId, [FromBody] UpdateProfileRequest req)
        {
            var user = await _db.Users
                .Include(u => u.UserProfile)
                .Include(u => u.UserSettings)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            // Create related if missing
            user.UserProfile ??= new UserProfile { UserId = user.Id };
            _db.UserProfiles.Attach(user.UserProfile);

            // Update profile fields
            user.UserProfile.FirstName = req.FirstName ?? "";
            user.UserProfile.LastName = req.LastName ?? "";
            user.UserProfile.PermanentAddress = req.PermanentAddress ?? "";
            user.UserProfile.Gender = req.Gender ?? "";
            user.UserProfile.EmergencyContact = req.EmergencyContact ?? "";
            user.UserProfile.UserType = req.UserType ?? "";
            user.UserProfile.InstitutionCompany = req.InstitutionCompany ?? "";
            user.UserProfile.Location = req.Location ?? "";
            user.UserProfile.UpdatedAt = DateTime.UtcNow;

            // Update email/phone if provided
            if (!string.IsNullOrWhiteSpace(req.MobileNumber))
                user.PhoneNumber = req.MobileNumber!.Trim();
            if (!string.IsNullOrWhiteSpace(req.EmailAddress))
                user.Email = req.EmailAddress!.Trim();

            await _db.SaveChangesAsync();

            return Ok(ToResponse(user));
        }

        // PUT api/users/{userId}/profile/settings
        [HttpPut("settings")]
        public async Task<ActionResult<ProfileResponse>> UpdateSettings(int userId, [FromBody] UpdateSettingsRequest req)
        {
            var user = await _db.Users.Include(u => u.UserProfile).Include(u => u.UserSettings)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            user.UserSettings ??= new UserSettings { UserId = user.Id };
            _db.UserSettings.Attach(user.UserSettings);

            user.UserSettings.EmailNotifications = req.EmailNotifications;
            user.UserSettings.SmsNotifications = req.SmsNotifications;
            user.UserSettings.ProfileVisibility = req.ProfileVisibility;
            user.UserSettings.ShowContactInfo = req.ShowContactInfo;

            await _db.SaveChangesAsync();

            return Ok(ToResponse(user));
        }

        // POST api/users/{userId}/profile/avatar
        // Content-Type: multipart/form-data; name="file"
        [HttpPost("avatar")]
        public async Task<ActionResult<ProfileResponse>> UploadAvatar(int userId, IFormFile file)
        {
            var user = await _db.Users.Include(u => u.UserProfile).Include(u => u.UserSettings)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            user.UserProfile ??= new UserProfile { UserId = user.Id };
            _db.UserProfiles.Attach(user.UserProfile);

            // Ensure /wwwroot/uploads/avatars exists
            var root = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "avatars");
            Directory.CreateDirectory(root);

            var fileName = $"u{userId}_{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            var path = Path.Combine(root, fileName);

            using (var stream = System.IO.File.Create(path))
            {
                await file.CopyToAsync(stream);
            }

            // Store a web URL path
            user.UserProfile.ProfileImageUrl = $"/uploads/avatars/{fileName}";
            await _db.SaveChangesAsync();

            return Ok(ToResponse(user));
        }

        private static ProfileResponse ToResponse(User user)
        {
            var p = user.UserProfile ?? new UserProfile { UserId = user.Id };
            var s = user.UserSettings ?? new UserSettings { UserId = user.Id };

            return new ProfileResponse
            {
                UserId = user.Id,
                FirstName = p.FirstName,
                LastName = p.LastName,
                PermanentAddress = p.PermanentAddress,
                Gender = p.Gender,
                MobileNumber = user.PhoneNumber ?? "",
                EmailAddress = user.Email,
                EmergencyContact = p.EmergencyContact,
                UserType = p.UserType,
                InstitutionCompany = p.InstitutionCompany,
                Location = p.Location,
                ProfileImage = p.ProfileImageUrl,
                EmailNotifications = s.EmailNotifications,
                SmsNotifications = s.SmsNotifications,
                ProfileVisibility = s.ProfileVisibility,
                ShowContactInfo = s.ShowContactInfo
            };
        }
    }
}
