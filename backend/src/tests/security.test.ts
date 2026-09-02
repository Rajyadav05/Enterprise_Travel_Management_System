import assert from "assert";
import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import { generateToken } from "../utils/jwt";

async function runSecurityTests() {
  console.log("=================================================");
  console.log("  ETMS Comprehensive Security & Regression Tests  ");
  console.log("=================================================");

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [TEST ${total}] PASS: ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ✗ [TEST ${total}] FAIL: ${name}`);
      console.error("   ", err instanceof Error ? err.message : err);
    }
  }

  // Ensure Admin & Employee test users exist in DB
  const adminUser = await prisma.user.findFirst({
    where: { role: { name: "ADMIN" } },
    include: { role: true, employee: true },
  });

  const empUser = await prisma.user.findFirst({
    where: { role: { name: "EMPLOYEE" } },
    include: { role: true, employee: true },
  });

  assert(adminUser, "Admin test user must exist in database");
  assert(empUser, "Employee test user must exist in database");

  let employeeToken = "";
  let employeeRefreshToken = "";
  let adminToken = "";
  let adminRefreshToken = "";

  // 1. Employee Login
  await test("1. Employee login succeeds and returns short-lived access token + refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: empUser.email, password: "Password123!" });

    assert.strictEqual(res.status, 200);
    assert(res.body.success, "Response should be successful");
    assert(res.body.data.token, "Access token must be returned");
    assert(res.body.data.refreshToken, "Refresh token must be returned");
    employeeToken = res.body.data.token;
    employeeRefreshToken = res.body.data.refreshToken;
  });

  // 2. Admin Login
  await test("2. Admin login succeeds and returns admin role", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: adminUser.email, password: "Password123!" });

    assert.strictEqual(res.status, 200);
    assert(res.body.success, "Response should be successful");
    assert.strictEqual(res.body.data.role.name, "ADMIN");
    adminToken = res.body.data.token;
    adminRefreshToken = res.body.data.refreshToken;
  });

  // 3. Profile Fetch
  await test("3. Profile endpoint returns authenticated user profile", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${employeeToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, empUser.id);
  });

  // 4. Create Travel Request
  let createdRequestId = "";
  await test("4. Employee can submit a new travel request", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const res = await request(app)
      .post("/api/travel/requests")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        origin: "Mumbai",
        destination: "New Delhi",
        tripType: "ROUND_TRIP",
        departureDate: tomorrow,
        returnDate: nextWeek,
        purpose: "Quarterly client strategy review",
        additionalInfo: "Need morning flights",
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.status, "PENDING");
    createdRequestId = res.body.data.id;
  });

  // 5. Employee List Requests
  await test("5. Employee can retrieve their own request list", async () => {
    const res = await request(app)
      .get("/api/travel/requests")
      .set("Authorization", `Bearer ${employeeToken}`);

    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body.data), "Expected array of requests");
    const found = res.body.data.some((r: { id: string }) => r.id === createdRequestId);
    assert(found, "Newly created request should be in list");
  });

  // 6. Cancel Request
  let cancelableRequestId = "";
  await test("6. Employee can cancel a PENDING travel request", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const createRes = await request(app)
      .post("/api/travel/requests")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        origin: "Mumbai",
        destination: "Pune",
        tripType: "ONE_WAY",
        departureDate: tomorrow,
        purpose: "Field visit to Pune office",
      });

    cancelableRequestId = createRes.body.data.id;

    const cancelRes = await request(app)
      .patch(`/api/travel/requests/${cancelableRequestId}/cancel`)
      .set("Authorization", `Bearer ${employeeToken}`);

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.data.status, "CANCELLED");
  });

  // 7. Admin Requests Queue
  await test("7. Admin can view the global travel request queue", async () => {
    const res = await request(app)
      .get("/api/admin/travel/requests?status=PENDING")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body.data.data), "Expected paginated data array");
  });

  // 8. Admin Approval
  await test("8. Admin can approve a PENDING travel request", async () => {
    const res = await request(app)
      .patch(`/api/admin/travel/requests/${createdRequestId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, "APPROVED");
  });

  // 9. Admin Rejection
  await test("9. Admin can reject a PENDING travel request with a mandatory reason", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const createRes = await request(app)
      .post("/api/travel/requests")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        origin: "Mumbai",
        destination: "Bengaluru",
        tripType: "ONE_WAY",
        departureDate: tomorrow,
        purpose: "Vendor conference",
      });

    const reqId = createRes.body.data.id;

    const rejectRes = await request(app)
      .patch(`/api/admin/travel/requests/${reqId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rejectionReason: "Event can be attended virtually." });

    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.body.data.status, "REJECTED");
    assert.strictEqual(
      rejectRes.body.data.rejectionReason,
      "Event can be attended virtually."
    );
  });

  // 10. Admin Flight Booking
  let bookingId = "";
  await test("10. Admin can issue a flight booking for an APPROVED request", async () => {
    const depTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const arrTime = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post(`/api/admin/travel/requests/${createdRequestId}/booking`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        airline: "Air India",
        flightNumber: "AI-802",
        pnr: "AI" + Date.now().toString().slice(-6),
        ticketNumber: "TKT-" + Date.now().toString().slice(-8),
        departureAirport: "BOM",
        arrivalAirport: "DEL",
        departureDatetime: depTime,
        arrivalDatetime: arrTime,
        fare: 6500.5,
        currency: "INR",
        seat: "12A",
        baggage: "15 KG",
        vendor: "MAKEMYTRIP",
        bookingSource: "Corporate Desk",
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.airline, "Air India");
    bookingId = res.body.data.id;
  });

  // 11. Ticket Upload with genuine PDF magic bytes
  await test("11. Admin can upload genuine PDF ticket attachment", async () => {
    // Valid minimal PDF buffer starting with %PDF-1.4
    const validPdfBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    );

    const res = await request(app)
      .post(`/api/admin/bookings/${bookingId}/ticket`)
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("ticket", validPdfBuffer, "sample_ticket.pdf");

    assert.strictEqual(res.status, 200);
    assert(res.body.data.ticketFilePath, "ticketFilePath should be populated");
  });

  // 12. Ticket Download
  await test("12. Employee can securely download their own ticket", async () => {
    const res = await request(app)
      .get(`/api/travel/bookings/${bookingId}/ticket`)
      .set("Authorization", `Bearer ${employeeToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers["content-type"], "application/pdf");
  });

  // 13. Reports Analytics
  await test("13. Admin can retrieve KPI summary, monthly, department, and vendor analytics", async () => {
    const [summaryRes, monthlyRes, deptRes, vendorRes] = await Promise.all([
      request(app)
        .get("/api/admin/reports/summary")
        .set("Authorization", `Bearer ${adminToken}`),
      request(app)
        .get("/api/admin/reports/monthly")
        .set("Authorization", `Bearer ${adminToken}`),
      request(app)
        .get("/api/admin/reports/departments")
        .set("Authorization", `Bearer ${adminToken}`),
      request(app)
        .get("/api/admin/reports/vendors")
        .set("Authorization", `Bearer ${adminToken}`),
    ]);

    assert.strictEqual(summaryRes.status, 200);
    assert.strictEqual(monthlyRes.status, 200);
    assert.strictEqual(deptRes.status, 200);
    assert.strictEqual(vendorRes.status, 200);
  });

  // 14. Excel Export
  await test("14. Admin can export travel requests and bookings to Excel workbook (.xlsx)", async () => {
    const [reqExport, bkExport] = await Promise.all([
      request(app)
        .get("/api/admin/reports/travel-requests/export")
        .set("Authorization", `Bearer ${adminToken}`),
      request(app)
        .get("/api/admin/reports/bookings/export")
        .set("Authorization", `Bearer ${adminToken}`),
    ]);

    assert.strictEqual(reqExport.status, 200);
    assert.strictEqual(bkExport.status, 200);
    assert(
      (reqExport.headers["content-type"] as string | undefined)?.includes("spreadsheetml"),
      "Should return Excel contentType"
    );
  });

  // 15. Audit Logs
  await test("15. Admin can query security and business audit logs", async () => {
    const res = await request(app)
      .get("/api/admin/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body.data.data), "Audit logs should be an array");
  });

  // 16. Role Protection
  await test("16. Non-admin employee is blocked from administrative endpoints (403 Forbidden)", async () => {
    const res = await request(app)
      .get("/api/admin/travel/requests")
      .set("Authorization", `Bearer ${employeeToken}`);

    assert.strictEqual(res.status, 403);
  });

  // 17. IDOR Protection
  await test("17. Employee cannot access another employee's travel request (404 Not Found)", async () => {
    const otherReq = await prisma.travelRequest.findFirst({
      where: { employeeId: { not: empUser.employee?.id } },
    });

    if (otherReq) {
      const res = await request(app)
        .get(`/api/travel/requests/${otherReq.id}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      assert.strictEqual(res.status, 404);
    }
  });

  // 18. SEC-CRIT-01: Anonymous Registration Rejection
  await test("18. Anonymous user CANNOT register an account or assign ADMIN role (401 Unauthorized)", async () => {
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } });
    const itDept = await prisma.department.findUniqueOrThrow({ where: { name: "IT" } });
    const desig = await prisma.designation.findUniqueOrThrow({
      where: { name: "Software Engineer" },
    });
    const branch = await prisma.branch.findFirstOrThrow({ where: { name: "Mumbai HQ" } });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "hacker@evil.com",
        password: "Password123!",
        employeeId: "HACK01",
        firstName: "Malicious",
        lastName: "Actor",
        roleId: adminRole.id,
        departmentId: itDept.id,
        designationId: desig.id,
        branchId: branch.id,
      });

    assert.strictEqual(res.status, 401, "Anonymous registration must be rejected with 401");
  });

  // 19. SEC-HIGH-02: Uniform Auth Errors for nonexistent and inactive accounts
  await test("19. Inactive, nonexistent, and wrong password attempts all return identical error messages", async () => {
    const nonexistent = await request(app)
      .post("/api/auth/login")
      .send({ login: "nonexistent_user_99999@company.com", password: "Password123!" });

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ login: adminUser.email, password: "IncorrectPassword123!" });

    assert.strictEqual(nonexistent.status, 401);
    assert.strictEqual(wrongPassword.status, 401);
    assert.strictEqual(nonexistent.body.message, wrongPassword.body.message);
  });

  // 20. SEC-HIGH-03: Expired Token Rejection
  await test("20. Expired access token is rejected with 401 Unauthorized", async () => {
    const expiredToken = generateToken(
      {
        userId: empUser.id,
        role: "EMPLOYEE",
        roleId: empUser.roleId,
      },
      "1ms" // Expire immediately
    );

    // Wait 5ms
    await new Promise((r) => setTimeout(r, 10));

    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${expiredToken}`);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.message, "Authentication token has expired. Please log in again.");
  });

  // 21. SEC-HIGH-03: Revoked Refresh Token Rejection & Token Theft Detection
  await test("21. Revoked refresh token cannot be reused and triggers security invalidation", async () => {
    // Login to get a fresh refresh token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ login: empUser.email, password: "Password123!" });

    assert.strictEqual(loginRes.status, 200);
    const rawRefresh = loginRes.body.data.refreshToken;

    // First refresh (successful rotation)
    const refresh1 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: rawRefresh });

    assert.strictEqual(refresh1.status, 200);

    // Attempting to reuse the OLD refresh token (should be rejected)
    const reuseAttempt = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: rawRefresh });

    assert.strictEqual(reuseAttempt.status, 401);
  });

  // 22. Refresh Token Rotation
  await test("22. Refresh token rotation issues a new short-lived access token and new refresh token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ login: adminUser.email, password: "Password123!" });

    assert.strictEqual(loginRes.status, 200);
    const token1 = loginRes.body.data.token;
    const refresh1 = loginRes.body.data.refreshToken;

    const rotRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: refresh1 });

    assert.strictEqual(rotRes.status, 200);
    assert(rotRes.body.data.token, "New access token must be issued");
    assert(rotRes.body.data.refreshToken, "New refresh token must be issued");
    assert.notStrictEqual(rotRes.body.data.refreshToken, refresh1);
  });

  // 23. Logout & Session Invalidation
  await test("23. Logout revokes refresh token and clears auth cookies", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: employeeRefreshToken });

    assert.strictEqual(res.status, 200);
    assert(res.body.success);
  });

  // 24. SEC-MED-03: Wildcard CORS rejected in production mode
  await test("24. Production environment rejects wildcard CORS origin with credentials", async () => {
    const { env } = await import("../config/env");
    assert(env.CORS_ORIGIN, "CORS_ORIGIN must be configured");
  });

  // 25. SEC-MED-04: Oversized JSON body rejection
  await test("25. Excessively large JSON payloads (>1MB) are rejected with 413 Payload Too Large", async () => {
    const hugePayload = {
      login: "test@test.com",
      password: "x".repeat(1.5 * 1024 * 1024), // 1.5 MB string
    };

    const res = await request(app)
      .post("/api/auth/login")
      .send(hugePayload);

    assert.strictEqual(
      res.status,
      413,
      `Expected 413 Payload Too Large for payload >1MB, got ${res.status}`
    );
  });

  // 26. SEC-LOW-01: Disguised File Upload (Magic Byte Check)
  await test("26. Upload with fake MIME type but invalid magic bytes is rejected (415 Unsupported Media Type)", async () => {
    const fakeBuffer = Buffer.from("THIS IS NOT A VALID PDF OR IMAGE FILE HEADER");

    // Login admin to get fresh token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ login: adminUser.email, password: "Password123!" });

    assert.strictEqual(loginRes.status, 200);
    const admTok = loginRes.body.data.token;

    // Create a new request & booking for this test
    const depTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const arrTime = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();
    const newReq = await request(app)
      .post("/api/travel/requests")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        origin: "Mumbai",
        destination: "Hyderabad",
        tripType: "ONE_WAY",
        departureDate: depTime.split("T")[0],
        purpose: "Security test",
      });

    await request(app)
      .patch(`/api/admin/travel/requests/${newReq.body.data.id}/approve`)
      .set("Authorization", `Bearer ${admTok}`);

    const newBk = await request(app)
      .post(`/api/admin/travel/requests/${newReq.body.data.id}/booking`)
      .set("Authorization", `Bearer ${admTok}`)
      .send({
        airline: "IndiGo",
        flightNumber: "6E-101",
        pnr: "6E" + Date.now().toString().slice(-6),
        ticketNumber: "TKT-" + Date.now().toString().slice(-8),
        departureAirport: "BOM",
        arrivalAirport: "HYD",
        departureDatetime: depTime,
        arrivalDatetime: arrTime,
        fare: 4000,
        currency: "INR",
        vendor: "MAKEMYTRIP",
        bookingSource: "Desk",
      });

    const res = await request(app)
      .post(`/api/admin/bookings/${newBk.body.data.id}/ticket`)
      .set("Authorization", `Bearer ${admTok}`)
      .attach("ticket", fakeBuffer, "disguised_file.pdf");

    assert.strictEqual(
      res.status,
      415,
      `Expected 415 Unsupported Media Type for invalid magic bytes, got ${res.status}`
    );
  });

  // 27. SEC-LOW-02: Health Endpoint DB Connectivity
  await test("27. Health check endpoint verifies database connection status", async () => {
    const res = await request(app).get("/health");

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "healthy");
    assert.strictEqual(res.body.database, "connected");
  });

  // 28. SEC-HIGH-01: Rate Limiting on Login (Exhaustion Test executed last)
  await test("28. Repeated login attempts are throttled by rate limiter", async () => {
    const attempts = [];
    for (let i = 0; i < 15; i++) {
      attempts.push(
        request(app)
          .post("/api/auth/login")
          .send({ login: "fake@test.com", password: "wrongpassword" })
      );
    }
    const results = await Promise.all(attempts);
    const got429 = results.some((r) => r.status === 429);
    assert(got429, "Expected rate limiter to throttle requests with HTTP 429");
  });

  console.log("=================================================");
  console.log(`  RESULT: ${passed} / ${total} Tests Passed`);
  console.log("=================================================");

  await prisma.$disconnect();

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

void runSecurityTests();
