using System.Globalization;

namespace BishalTravels.Api.Services;

public interface ICalculationService
{
    (decimal totalKm, decimal totalHours, decimal extraHours) CalculateTripMetrics(
        decimal startKm, decimal endKm, string startTime, string endTime, decimal standardHoursPerDay = 10.0m);

    (decimal subtotal, decimal cgst, decimal sgst, decimal igst, decimal tdsAmount, decimal grandTotal, decimal netPayable, string amountInWords) 
    CalculateInvoiceFinancials(
        decimal itemsSubtotal,
        string taxType,
        decimal taxRate,
        bool isInterstate,
        decimal discount,
        decimal advanceReceived,
        decimal tdsRate);

    string ConvertToIndianCurrencyWords(decimal amount);
}

public class CalculationService : ICalculationService
{
    public (decimal totalKm, decimal totalHours, decimal extraHours) CalculateTripMetrics(
        decimal startKm, decimal endKm, string startTime, string endTime, decimal standardHoursPerDay = 10.0m)
    {
        var totalKm = Math.Max(0, endKm - startKm);
        var totalHours = 0.0m;

        if (TimeSpan.TryParse(startTime, out var start) && TimeSpan.TryParse(endTime, out var end))
        {
            var diff = end - start;
            if (diff < TimeSpan.Zero)
            {
                // Overnight duty
                diff = diff.Add(TimeSpan.FromHours(24));
            }
            // Transport rule: Fractional hours round UP (e.g. 14.01 -> 15, 14.83 -> 15)
            totalHours = Math.Ceiling((decimal)diff.TotalHours);
        }

        // Overtime hours round UP (e.g. 2.01 -> 3, 2.83 -> 3)
        var extraHours = Math.Max(0, Math.Ceiling(totalHours - standardHoursPerDay));

        return (totalKm, totalHours, extraHours);
    }

    public (decimal subtotal, decimal cgst, decimal sgst, decimal igst, decimal tdsAmount, decimal grandTotal, decimal netPayable, string amountInWords) 
    CalculateInvoiceFinancials(
        decimal itemsSubtotal,
        string taxType,
        decimal taxRate,
        bool isInterstate,
        decimal discount,
        decimal advanceReceived,
        decimal tdsRate)
    {
        var subtotal = Math.Max(0, itemsSubtotal - discount);

        decimal cgst = 0;
        decimal sgst = 0;
        decimal igst = 0;

        if (taxType != "NON_GST" && taxRate > 0)
        {
            var taxAmount = Math.Round(subtotal * (taxRate / 100m), 2);
            if (isInterstate)
            {
                igst = taxAmount;
            }
            else
            {
                cgst = Math.Round(taxAmount / 2m, 2);
                sgst = Math.Round(taxAmount / 2m, 2);
            }
        }

        var totalTax = cgst + sgst + igst;
        var grandTotal = Math.Round(subtotal + totalTax, 2);

        var tdsAmount = 0m;
        if (tdsRate > 0)
        {
            tdsAmount = Math.Round(subtotal * (tdsRate / 100m), 2);
        }

        var netPayable = Math.Max(0, Math.Round(grandTotal - advanceReceived - tdsAmount, 2));
        var amountInWords = ConvertToIndianCurrencyWords(netPayable);

        return (subtotal, cgst, sgst, igst, tdsAmount, grandTotal, netPayable, amountInWords);
    }

    public string ConvertToIndianCurrencyWords(decimal amount)
    {
        var wholeAmount = (long)Math.Floor(amount);
        var paise = (int)Math.Round((amount - wholeAmount) * 100);

        if (wholeAmount == 0 && paise == 0)
        {
            return "Rupees Zero Only";
        }

        var words = "Rupees " + NumberToWords(wholeAmount).Trim();

        if (paise > 0)
        {
            words += " and " + NumberToWords(paise).Trim() + " Paise";
        }

        return words + " Only";
    }

    private static string NumberToWords(long number)
    {
        if (number == 0) return "Zero";
        if (number < 0) return "Minus " + NumberToWords(Math.Abs(number));

        var unitsMap = new[] {
            "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
            "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
        };
        var tensMap = new[] {
            "Zero", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        };

        var words = "";

        if (number / 10000000 > 0)
        {
            words += NumberToWords(number / 10000000) + " Crore ";
            number %= 10000000;
        }

        if (number / 100000 > 0)
        {
            words += NumberToWords(number / 100000) + " Lakh ";
            number %= 100000;
        }

        if (number / 1000 > 0)
        {
            words += NumberToWords(number / 1000) + " Thousand ";
            number %= 1000;
        }

        if (number / 100 > 0)
        {
            words += NumberToWords(number / 100) + " Hundred ";
            number %= 100;
        }

        if (number > 0)
        {
            if (number < 20)
            {
                words += unitsMap[number];
            }
            else
            {
                words += tensMap[number / 10];
                if (number % 10 > 0)
                {
                    words += " " + unitsMap[number % 10];
                }
            }
        }

        return words.Trim();
    }
}
