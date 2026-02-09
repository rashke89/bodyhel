const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== "undefined") {
      localStorage.setItem("token", token);
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Just throw error, don't handle 401 or clear tokens
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async requestBlob(endpoint: string): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Download failed" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
  }) {
    const response = await this.request<{
      user: any;
      token: string;
      refreshToken: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      user: any;
      token: string;
      refreshToken: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      this.setToken(response.token);
      // Token is already saved in setToken method
    }
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>("/auth/me");
  }

  async updateProfile(data: any) {
    return this.request<{ user: any }>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Appointments
  async getAppointments(params?: {
    patient?: string;
    doctor?: string;
    status?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    return this.request<{ appointments: any[] }>(
      `/appointments?${query.toString()}`,
    );
  }

  async getAppointment(id: string) {
    return this.request<{ appointment: any }>(`/appointments/${id}`);
  }

  async createAppointment(data: any) {
    return this.request<{ appointment: any }>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id: string, data: any) {
    return this.request<{ appointment: any }>(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id: string) {
    return this.request<{ message: string }>(`/appointments/${id}`, {
      method: "DELETE",
    });
  }

  async scheduleFollowUp(
    id: string,
    data: {
      date: string;
      startTime: string;
      endTime: string;
      duration?: number;
      reason?: string;
      isRecurring?: boolean;
      recurringPattern?: string;
      recurringEndDate?: string;
    },
  ) {
    return this.request<{ appointment: any }>(`/appointments/${id}/follow-up`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async rescheduleAppointment(id: string, data: any) {
    return this.request<{ appointment: any }>(
      `/appointments/${id}/reschedule`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async cancelAppointment(id: string, reason?: string) {
    return this.request<{ appointment: any }>(`/appointments/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getDoctorAvailability(doctorId: string, date: string) {
    return this.request<{ availableSlots: any[] }>(
      `/appointments/availability/${doctorId}?date=${date}`,
    );
  }

  // EHR
  async searchEHRs(params?: {
    patientId?: string;
    diagnosisCode?: string;
    alertType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    return this.request<{ ehrs: any[]; count: number }>(
      `/ehr/search?${query.toString()}`,
    );
  }

  async getEHR(patientId: string) {
    return this.request<{ ehr: any }>(`/ehr/patient/${patientId}`);
  }

  async updateEHR(patientId: string, data: any) {
    return this.request<{ ehr: any }>(`/ehr/patient/${patientId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async addDiagnosis(patientId: string, data: any) {
    return this.request<{ diagnosis: any }>(
      `/ehr/patient/${patientId}/diagnosis`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async addMedicalAlert(patientId: string, data: any) {
    return this.request<{ alert: any }>(`/ehr/patient/${patientId}/alert`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addVitalSigns(patientId: string, data: any) {
    return this.request<{ vitalSigns: any }>(
      `/ehr/patient/${patientId}/vitals`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async uploadDocument(patientId: string, data: any) {
    return this.request<{ document: any }>(
      `/ehr/patient/${patientId}/documents`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  // Prescriptions
  async getPrescriptions(params?: {
    patient?: string;
    doctor?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    return this.request<{ prescriptions: any[] }>(
      `/prescriptions?${query.toString()}`,
    );
  }

  async createPrescription(data: any) {
    return this.request<{ prescription: any }>("/prescriptions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Lab Results
  async getLabResults(params?: {
    patient?: string;
    status?: string;
    testType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    return this.request<{ labResults: any[] }>(
      `/lab-results?${query.toString()}`,
    );
  }

  async orderLabTest(data: any) {
    return this.request<{ labResult: any }>("/lab-results", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Telemedicine
  async getTelemedicineSessions(params?: {
    patient?: string;
    doctor?: string;
    status?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    return this.request<{ sessions: any[] }>(
      `/telemedicine?${query.toString()}`,
    );
  }

  async createTelemedicineSession(data: any) {
    return this.request<{ session: any }>("/telemedicine", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async startSession(id: string) {
    return this.request<{ session: any }>(`/telemedicine/${id}/start`, {
      method: "POST",
    });
  }

  async endSession(id: string, data: any) {
    return this.request<{ session: any }>(`/telemedicine/${id}/end`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSessionJoinInfo(id: string) {
    return this.request<{ roomId: string; sessionType: string }>(
      `/telemedicine/${id}/join`,
    );
  }

  // Messages
  async getMessages(params?: {
    type?: string;
    priority?: string;
    read?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    return this.request<{ messages: any[] }>(`/messages?${query.toString()}`);
  }

  async getUnreadCount() {
    return this.request<{ unreadCount: number }>("/messages/unread-count");
  }

  async sendMessage(data: any) {
    return this.request<{ message: any }>("/messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async markAsRead(id: string) {
    return this.request<{ message: any }>(`/messages/${id}/read`, {
      method: "PUT",
    });
  }

  // Patient Portal
  async getPatientDashboard() {
    return this.request<{
      upcomingAppointments: any[];
      recentPrescriptions: any[];
      unreadMessagesCount: number;
      recentLabResults: any[];
      activeAlerts: any[];
    }>("/patient-portal/dashboard");
  }

  async getPatientMedicalRecords() {
    return this.request<{ ehr: any }>("/patient-portal/medical-records");
  }

  async getPatientDocuments(type?: string) {
    const query = type ? `?type=${type}` : "";
    return this.request<{ documents: any[] }>(
      `/patient-portal/documents${query}`,
    );
  }

  async getPatientDoctors(specialization?: string) {
    const query = specialization ? `?specialization=${specialization}` : "";
    return this.request<{ doctors: any[] }>(`/patient-portal/doctors${query}`);
  }

  // Admin
  async getAdminDashboard() {
    return this.request<{
      users: any;
      appointments: any;
      ehrs: any;
      prescriptions: any;
      labResults: any;
      messages: any;
    }>("/admin/dashboard");
  }

  async getUsers(params?: {
    role?: string;
    isActive?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, value.toString());
      });
    }
    return this.request<{ users: any[]; pagination: any }>(
      `/admin/users?${query.toString()}`,
    );
  }

  async getUser(id: string) {
    return this.request<{ user: any }>(`/admin/users/${id}`);
  }

  async createUser(data: any) {
    return this.request<{ user: any }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request<{ user: any }>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/admin/users/${id}`, {
      method: "DELETE",
    });
  }

  // Reports
  async getAppointmentReport(params: {
    startDate?: string;
    endDate?: string;
    doctor?: string;
    status?: string;
  }) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });
    return this.request<{ statistics: any; appointments: any[] }>(
      `/reports/appointments?${query.toString()}`,
    );
  }

  async getPrescriptionReport(params?: {
    startDate?: string;
    endDate?: string;
    doctor?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    return this.request<{ statistics: any; prescriptions: any[] }>(
      `/reports/prescriptions?${query.toString()}`,
    );
  }

  async getLabResultsReport(params?: {
    startDate?: string;
    endDate?: string;
    testType?: string;
    status?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    return this.request<{ statistics: any; labResults: any[] }>(
      `/reports/lab-results?${query.toString()}`,
    );
  }

  // Saved Reports CRUD
  async getSavedReports(params?: {
    reportType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, value.toString());
      });
    }
    return this.request<{ reports: any[]; pagination: any }>(
      `/reports/saved?${query.toString()}`,
    );
  }

  async getSavedReport(id: string) {
    return this.request<{ report: any }>(`/reports/saved/${id}`);
  }

  async createSavedReport(data: any) {
    return this.request<{ report: any }>("/reports/saved", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSavedReport(id: string, data: any) {
    return this.request<{ report: any }>(`/reports/saved/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSavedReport(id: string) {
    return this.request<{ message: string }>(`/reports/saved/${id}`, {
      method: "DELETE",
    });
  }

  // Audit Logs
  async getAuditLogs(params?: {
    user?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, value.toString());
      });
    }
    return this.request<{ logs: any[]; pagination: any }>(
      `/admin/audit-logs?${query.toString()}`,
    );
  }

  // Integrations
  async getICD10Codes(search?: string) {
    const query = search ? `?search=${search}` : "";
    return this.request<{ codes: any[] }>(`/integrations/izjzs/icd10${query}`);
  }

  async verifyInsurance(insuranceNumber: string) {
    return this.request<{ verified: boolean; patientInfo?: any }>(
      "/integrations/rfzo/verify-insurance",
      {
        method: "POST",
        body: JSON.stringify({ insuranceNumber }),
      },
    );
  }

  // PDF Downloads
  async downloadPrescriptionPDF(id: string): Promise<Blob> {
    return this.requestBlob(`/prescriptions/${id}/pdf`);
  }

  async downloadLabResultPDF(id: string): Promise<Blob> {
    return this.requestBlob(`/lab-results/${id}/pdf`);
  }

  async downloadReportPDF(params: {
    reportType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });
    return this.requestBlob(`/reports/export?${query.toString()}`);
  }

  // Demographics report
  async getDemographicsReport() {
    return this.request<{ statistics: any }>("/reports/demographics");
  }
}

export const api = new ApiClient(API_BASE_URL);
