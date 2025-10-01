using Microsoft.AspNetCore.Mvc;
using BoardingBee_backend.Models;
using BoardingBee_backend.Controllers.Dto;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Handles user management endpoints, including profile and settings updates.
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

    // Constructor injecting the database context.
        public UsersController(AppDbContext context)
        {
            _context = context;
        }

    // Returns all users in the system.
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }

    // Returns a user by ID.
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        
    // Creates a new user.
        [HttpPost]
        public async Task<IActionResult> CreateUser(BoardingBee_backend.Models.User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        // GET api/users/{userId}/profile
        // Returns the profile for a given user ID.
        [HttpGet("{userId}/profile")]
        public async Task<ActionResult<ProfileResponse>> GetProfile(int userId)
        {
            var user = await _context.Users.Include(u => u.UserSettings).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();
            return Ok(ToProfileResponse(user));
        }

        // Updates the profile for a given user ID.
        [HttpPut("{userId}/profile")]
        public async Task<ActionResult<ProfileResponse>> UpdateProfile(int userId, [FromBody] UpdateProfileRequest req)
        {
            var user = await _context.Users.Include(u => u.UserSettings).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            user.FirstName = req.FirstName ?? "";
            user.LastName = req.LastName ?? "";
            user.PermanentAddress = req.PermanentAddress ?? "";
            user.Gender = req.Gender ?? "";
            user.EmergencyContact = req.EmergencyContact ?? "";
            user.UserType = req.UserType ?? "";
            user.InstitutionCompany = req.InstitutionCompany ?? "";
            user.Location = req.Location ?? "";
            user.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(req.MobileNumber))
                user.PhoneNumber = req.MobileNumber!.Trim();
            if (!string.IsNullOrWhiteSpace(req.EmailAddress))
                user.Email = req.EmailAddress!.Trim();

            await _context.SaveChangesAsync();
            return Ok(ToProfileResponse(user));
        }

    // Updates notification and privacy settings for a given user ID.
    [HttpPut("{userId}/profile/settings")]
    public async Task<ActionResult<ProfileResponse>> UpdateSettings(int userId, [FromBody] UpdateSettingsRequest req)
        {
            var user = await _context.Users.Include(u => u.UserSettings).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            user.UserSettings ??= new UserSettings { UserId = user.Id };
            _context.UserSettings.Attach(user.UserSettings);
            user.UserSettings.EmailNotifications = req.EmailNotifications;
            user.UserSettings.SmsNotifications = req.SmsNotifications;
            user.UserSettings.ProfileVisibility = req.ProfileVisibility;
            user.UserSettings.ShowContactInfo = req.ShowContactInfo;

            await _context.SaveChangesAsync();
            return Ok(ToProfileResponse(user));
        }

        // POST api/users/{userId}/profile/avatar
        [HttpPost("{userId}/profile/avatar")]
    public async Task<ActionResult<ProfileResponse>> UploadAvatar(int userId, IFormFile file)
        {
            var user = await _context.Users.Include(u => u.UserSettings).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            var env = HttpContext.RequestServices.GetService(typeof(IWebHostEnvironment)) as IWebHostEnvironment;
            var root = Path.Combine(env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "avatars");
            Directory.CreateDirectory(root);
            var fileName = $"u{userId}_{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            var path = Path.Combine(root, fileName);
            using (var stream = System.IO.File.Create(path))
            {
                await file.CopyToAsync(stream);
            }
            user.ProfileImageUrl = $"/uploads/avatars/{fileName}";
            await _context.SaveChangesAsync();
            return Ok(ToProfileResponse(user));
        }

    private static ProfileResponse ToProfileResponse(BoardingBee_backend.Models.User user)
        {
            var s = user.UserSettings ?? new UserSettings { UserId = user.Id };
            return new ProfileResponse
            {
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PermanentAddress = user.PermanentAddress,
                Gender = user.Gender,
                MobileNumber = user.PhoneNumber ?? "",
                EmailAddress = user.Email,
                EmergencyContact = user.EmergencyContact,
                UserType = user.UserType,
                InstitutionCompany = user.InstitutionCompany,
                Location = user.Location,
                ProfileImage = user.ProfileImageUrl,
                EmailNotifications = s.EmailNotifications,
                SmsNotifications = s.SmsNotifications,
                ProfileVisibility = s.ProfileVisibility,
                ShowContactInfo = s.ShowContactInfo
            };
        }
    }
}
