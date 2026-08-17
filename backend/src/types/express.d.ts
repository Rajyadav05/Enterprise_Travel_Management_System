export interface AuthUser {
  id: string;
  email: string;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    status: string;
  } | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
