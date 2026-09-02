import { z } from "zod";

const datetimeField = z
  .union([
    z.string().datetime({ offset: true }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?Z?$/),
  ])
  .transform((val) => new Date(val));

export const createBookingSchema = z
  .object({
    airline: z
      .string()
      .trim()
      .min(1, "Airline is required")
      .max(100, "Airline must not exceed 100 characters"),

    flightNumber: z
      .string()
      .trim()
      .min(1, "Flight number is required")
      .max(50, "Flight number must not exceed 50 characters"),

    pnr: z
      .string()
      .trim()
      .min(1, "PNR is required")
      .max(50, "PNR must not exceed 50 characters"),

    ticketNumber: z
      .string()
      .trim()
      .min(1, "Ticket number is required")
      .max(50, "Ticket number must not exceed 50 characters"),

    departureAirport: z
      .string()
      .trim()
      .min(1, "Departure airport is required")
      .max(50, "Departure airport must not exceed 50 characters"),

    arrivalAirport: z
      .string()
      .trim()
      .min(1, "Arrival airport is required")
      .max(50, "Arrival airport must not exceed 50 characters"),

    departureDatetime: datetimeField,

    arrivalDatetime: datetimeField,

    fare: z
      .number()
      .min(0, "Fare must be greater than or equal to 0"),

    currency: z
      .string()
      .trim()
      .min(1, "Currency is required")
      .max(10, "Currency must not exceed 10 characters"),

    seat: z
      .string()
      .trim()
      .max(50, "Seat must not exceed 50 characters")
      .optional()
      .nullable(),

    baggage: z
      .string()
      .trim()
      .max(100, "Baggage must not exceed 100 characters")
      .optional()
      .nullable(),

    vendor: z.enum([
      "MAKEMYTRIP",
      "CLEARTRIP",
      "AIRLINE_WEBSITE",
      "TRAVEL_AGENT",
      "CORPORATE_TRAVEL_AGENT",
      "KNOWN_PERSON",
      "OTHER",
    ] as const),

    bookingSource: z
      .string()
      .trim()
      .min(1, "Booking source is required")
      .max(200, "Booking source must not exceed 200 characters"),
  })
  .superRefine((data, ctx) => {
    // Rule: departure and arrival airports cannot be identical
    if (
      data.departureAirport.toLowerCase() === data.arrivalAirport.toLowerCase()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["arrivalAirport"],
        message: "Arrival airport cannot be the same as departure airport",
      });
    }

    // Rule: arrivalDatetime must be after departureDatetime
    if (data.arrivalDatetime <= data.departureDatetime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["arrivalDatetime"],
        message: "Arrival datetime must be after departure datetime",
      });
    }
  });

export type CreateBookingSchema = z.infer<typeof createBookingSchema>;
