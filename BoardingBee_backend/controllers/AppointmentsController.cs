using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Services.Notifications.EmailNotifier _emailNotifier;
        public AppointmentsController(AppDbContext context, Services.Notifications.EmailNotifier emailNotifier)
        {
            _context = context;
            _emailNotifier = emailNotifier;
        }

        // POST: api/appointments
        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] Appointment appointment)
        {
            appointment.Status = "pending";
            // Ensure ListingTitle is set
            if (string.IsNullOrWhiteSpace(appointment.ListingTitle))
            {
                var listing = await _context.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == appointment.ListingId);
                if (listing != null)
                {
                    appointment.ListingTitle = listing.Title;
                }
            }
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            return Ok(appointment);
        }

        // GET: api/appointments/owner/{ownerEmail}
        [HttpGet("owner/{ownerEmail}")]
        public async Task<IActionResult> GetAppointmentsForOwner(string ownerEmail)
        {
            var listings = await _context.Listings.Where(l => l.Owner.Email == ownerEmail).ToListAsync();
            var listingIds = listings.Select(l => l.Id).ToList();
            var appointments = await _context.Appointments.Where(a => listingIds.Contains(a.ListingId)).ToListAsync();
            return Ok(appointments);
        }

        // PATCH: api/appointments/{id}/confirm
        [HttpPatch("{id}/confirm")]
        public async Task<IActionResult> ConfirmAppointment(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            appointment.Status = "confirmed";
            await _context.SaveChangesAsync();
            return Ok(appointment);
        }

        // PATCH: api/appointments/{id}/reject
        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> RejectAppointment(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            appointment.Status = "rejected";
            // Ensure ListingTitle is set before sending email
            if (string.IsNullOrWhiteSpace(appointment.ListingTitle))
            {
                var listing = await _context.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == appointment.ListingId);
                if (listing != null)
                {
                    appointment.ListingTitle = listing.Title;
                    // Optionally update in DB for future reference
                    _context.Appointments.Update(appointment);
                    await _context.SaveChangesAsync();
                }
            }
            else
            {
                await _context.SaveChangesAsync();
            }
            // Send rejection email
            if (!string.IsNullOrWhiteSpace(appointment.UserEmail))
            {
                var subject = "Your Boarding Appointment Request was Rejected";
                var body = $"We're sorry, but your appointment request to view '{appointment.ListingTitle}' on {appointment.Date:dd MMM yyyy} was rejected by the owner.";
                await _emailNotifier.SendToEmailAsync(appointment.UserEmail, subject, body);
            }
            return Ok(appointment);
        }
    }
}
