import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { RESPONSE_MESSAGES } from "../../utils/constants";
import { comparePassword, hashPassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";
import type {
  AuthResponseData,
  LoginInput,
  RegisterInput,
  SafeEmployee,
  SafeUser,
  UserProfileResponse,
} from "./auth.types";

export class AuthService {
  /**
   * Authenticates a user by email or employeeId.
   * If login contains '@', it searches by email. Otherwise, it searches by employeeId.
   */
  public async login(input: LoginInput): Promise<AuthResponseData> {
    const rawLogin = input.login.trim();
    const isEmail = rawLogin.includes("@");

    let user;
    let employee = null;

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: rawLogin.toLowerCase() },
        include: {
          role: true,
          employee: true,
        },
      });

      if (user) {
        employee = user.employee;
      }
    } else {
      const foundEmployee = await prisma.employee.findUnique({
        where: { employeeId: rawLogin },
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
      });

      if (foundEmployee) {
        user = {
          ...foundEmployee.user,
          employee: foundEmployee,
        };
        employee = foundEmployee;
      }
    }

    if (!user) {
      throw ApiError.unauthorized(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw ApiError.forbidden(RESPONSE_MESSAGES.USER_INACTIVE);
    }

    if (employee && employee.status !== "ACTIVE") {
      throw ApiError.forbidden(RESPONSE_MESSAGES.EMPLOYEE_INACTIVE);
    }

    const isPasswordValid = await comparePassword(
      input.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw ApiError.unauthorized(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    const token = generateToken({
      userId: user.id,
      role: user.role.name,
      roleId: user.role.id,
      employeeId: employee?.employeeId,
    });

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const safeEmployee: SafeEmployee | null = employee
      ? {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
          dateOfJoining: employee.dateOfJoining,
          employmentType: employee.employmentType,
          status: employee.status,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          branchId: employee.branchId,
          reportingManagerId: employee.reportingManagerId,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
        }
      : null;

    return {
      token,
      user: safeUser,
      employee: safeEmployee,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
      },
    };
  }

  /**
   * Retrieves the detailed profile of an authenticated user.
   */
  public async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        employee: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            designation: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
                country: true,
              },
            },
            reportingManager: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound("User profile not found");
    }

    if (!user.isActive) {
      throw ApiError.forbidden(RESPONSE_MESSAGES.USER_INACTIVE);
    }

    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeId: user.employee.employeeId,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            phone: user.employee.phone,
            dateOfJoining: user.employee.dateOfJoining,
            employmentType: user.employee.employmentType,
            status: user.employee.status,
            departmentId: user.employee.departmentId,
            designationId: user.employee.designationId,
            branchId: user.employee.branchId,
            reportingManagerId: user.employee.reportingManagerId,
            createdAt: user.employee.createdAt,
            updatedAt: user.employee.updatedAt,
            department: user.employee.department,
            designation: user.employee.designation,
            branch: user.employee.branch,
            reportingManager: user.employee.reportingManager,
          }
        : null,
    };
  }

  /**
   * Registers a new user and employee in a single transaction (Development/Onboarding).
   */
  public async register(input: RegisterInput): Promise<AuthResponseData> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedEmployeeId = input.employeeId.trim();

    // Check unique email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw ApiError.conflict(`User with email "${normalizedEmail}" already exists`);
    }

    // Check unique employeeId
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId: normalizedEmployeeId },
    });
    if (existingEmployee) {
      throw ApiError.conflict(
        `Employee with ID "${normalizedEmployeeId}" already exists`
      );
    }

    // Verify foreign key entities
    const [role, department, designation, branch] = await Promise.all([
      prisma.role.findUnique({ where: { id: input.roleId } }),
      prisma.department.findUnique({ where: { id: input.departmentId } }),
      prisma.designation.findUnique({ where: { id: input.designationId } }),
      prisma.branch.findUnique({ where: { id: input.branchId } }),
    ]);

    if (!role) {
      throw ApiError.badRequest(`Role with ID "${input.roleId}" does not exist`);
    }
    if (!department) {
      throw ApiError.badRequest(
        `Department with ID "${input.departmentId}" does not exist`
      );
    }
    if (!designation) {
      throw ApiError.badRequest(
        `Designation with ID "${input.designationId}" does not exist`
      );
    }
    if (!branch) {
      throw ApiError.badRequest(`Branch with ID "${input.branchId}" does not exist`);
    }

    if (input.reportingManagerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: input.reportingManagerId },
      });
      if (!manager) {
        throw ApiError.badRequest(
          `Reporting manager with ID "${input.reportingManagerId}" does not exist`
        );
      }
    }

    const hashedPassword = await hashPassword(input.password);

    // Execute User and Employee creation in a single transaction
    const { createdUser, createdEmployee } = await prisma.$transaction(
      async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash: hashedPassword,
            roleId: input.roleId,
            isActive: true,
          },
        });

        const newEmployee = await tx.employee.create({
          data: {
            employeeId: normalizedEmployeeId,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            phone: input.phone?.trim() ?? null,
            dateOfJoining: input.dateOfJoining
              ? new Date(input.dateOfJoining)
              : null,
            employmentType: input.employmentType ?? "PERMANENT",
            status: "ACTIVE",
            userId: newUser.id,
            departmentId: input.departmentId,
            designationId: input.designationId,
            branchId: input.branchId,
            reportingManagerId: input.reportingManagerId ?? null,
          },
        });

        return { createdUser: newUser, createdEmployee: newEmployee };
      }
    );

    const token = generateToken({
      userId: createdUser.id,
      role: role.name,
      roleId: role.id,
      employeeId: createdEmployee.employeeId,
    });

    return {
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        roleId: createdUser.roleId,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      },
      employee: {
        id: createdEmployee.id,
        employeeId: createdEmployee.employeeId,
        firstName: createdEmployee.firstName,
        lastName: createdEmployee.lastName,
        phone: createdEmployee.phone,
        dateOfJoining: createdEmployee.dateOfJoining,
        employmentType: createdEmployee.employmentType,
        status: createdEmployee.status,
        departmentId: createdEmployee.departmentId,
        designationId: createdEmployee.designationId,
        branchId: createdEmployee.branchId,
        reportingManagerId: createdEmployee.reportingManagerId,
        createdAt: createdEmployee.createdAt,
        updatedAt: createdEmployee.updatedAt,
      },
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
    };
  }
}

export const authService = new AuthService();
