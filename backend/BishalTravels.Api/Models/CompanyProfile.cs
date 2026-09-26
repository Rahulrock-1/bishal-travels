using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BishalTravels.Api.Models;

[Table("company_profiles")]
public class CompanyProfile
{
    [Key]
    public int Id { get; set; } = 1;

    [Required]
    [MaxLength(200)]
    public string BusinessName { get; set; } = "BISHAL TRAVELS";

    [MaxLength(250)]
    public string Tagline { get; set; } = "Car Run & Monthly Travel Invoicing System";

    [Required]
    [MaxLength(100)]
    public string TradeLicenseNo { get; set; } = "TR/0924/88921";

    [MaxLength(100)]
    public string? VendorId { get; set; } = "BT-WB-2024";

    [Required]
    [MaxLength(20)]
    public string Gstin { get; set; } = "19AAGFB4981E1Z5";

    [Required]
    [MaxLength(20)]
    public string Pan { get; set; } = "AAGFB4981E";

    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = "Vill + P.O. - Boinchigram, Dist - Hooghly, Pin - 712134, West Bengal";

    [Required]
    [MaxLength(50)]
    public string Phone { get; set; } = "+91 97321 00000 / 98320 00000";

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = "biswajitpramanikrock@gmail.com";

    [Required]
    [MaxLength(150)]
    public string BankName { get; set; } = "STATE BANK OF INDIA";

    [Required]
    [MaxLength(150)]
    public string AccountHolder { get; set; } = "BISWAJIT PRAMANIK (BISHAL TRAVELS)";

    [Required]
    [MaxLength(50)]
    public string AccountNumber { get; set; } = "38920194821";

    [Required]
    [MaxLength(20)]
    public string IfscCode { get; set; } = "SBIN0001234";

    [Required]
    [MaxLength(150)]
    public string BranchName { get; set; } = "Boinchi Branch, Hooghly";

    [MaxLength(100)]
    public string UpiId { get; set; } = "9732100000@sbi";

    [Required]
    [MaxLength(150)]
    public string SignatoryName { get; set; } = "Biswajit Pramanik";

    [Required]
    [MaxLength(100)]
    public string SignatoryTitle { get; set; } = "Proprietor / Authorized Signatory";

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    public string[] DefaultTerms { get; set; } = new string[]
    {
        "Payment is strictly due within the agreed credit cycle from invoice receipt date.",
        "Cheques/NEFT/RTGS/UPI payments must be drawn in favor of 'BISWAJIT PRAMANIK (BISHAL TRAVELS)'.",
        "Disputes or kilometer reading differences must be raised within 7 business days of billing date.",
        "Overtime charges apply beyond 10 operational hours per duty assignment.",
        "Toll, parking, and interstate permits are billed at actuals as attached in duty annexure."
    };

    public bool IsConfigured { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
