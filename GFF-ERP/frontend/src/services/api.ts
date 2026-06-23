import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  Employee, EmployeeFilters, AttendanceRecord, AttendanceFilters, AttendanceSummary,
  LeaveRequest, LeaveBalance, PayrollPeriod, EmployeePayroll, PayslipData,
  Lead, Activity, Customer, Vehicle, Driver, Trip, FuelLog, MaintenanceRecord,
  PaginatedResponse, ApiResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  private async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  private async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  private async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  private async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // ==================== EMPLOYEES ====================
  async getEmployees(filters?: EmployeeFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.jobTitle) params.append('jobTitle', filters.jobTitle);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return this.get<PaginatedResponse<Employee>>(`/employees?${params.toString()}`);
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.get<Employee>(`/employees/${id}`);
  }

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    return this.post<Employee>('/employees', data);
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    return this.put<Employee>(`/employees/${id}`, data);
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.delete<void>(`/employees/${id}`);
  }

  async exportEmployees(filters?: EmployeeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branch) params.append('branch', filters.branch);
    const response = await this.client.get(`/employees/export?${params.toString()}`, { responseType: 'blob' });
    return response.data;
  }

  async getDepartments(): Promise<string[]> {
    return this.get<string[]>('/employees/departments');
  }

  async getJobTitles(): Promise<string[]> {
    return this.get<string[]>('/employees/job-titles');
  }

  async getBranches(): Promise<string[]> {
    return this.get<string[]>('/employees/branches');
  }

  async getSupervisors(): Promise<{ id: string; name: string }[]> {
    return this.get<{ id: string; name: string }[]>('/employees/supervisors');
  }

  // ==================== ATTENDANCE ====================
  async getAttendance(filters?: AttendanceFilters): Promise<PaginatedResponse<AttendanceRecord>> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    return this.get<PaginatedResponse<AttendanceRecord>>(`/attendance?${params.toString()}`);
  }

  async getAttendanceSummary(filters?: AttendanceFilters): Promise<AttendanceSummary> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.department) params.append('department', filters.department);
    return this.get<AttendanceSummary>(`/attendance/summary?${params.toString()}`);
  }

  async updateAttendance(id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    return this.patch<AttendanceRecord>(`/attendance/${id}`, data);
  }

  async bulkAttendance(data: { employeeIds: string[]; date: string; status: string }[]): Promise<void> {
    return this.post<void>('/attendance/bulk', data);
  }

  async getEmployeeMonthlyAttendance(employeeId: string, month: number, year: number): Promise<AttendanceRecord[]> {
    return this.get<AttendanceRecord[]>(`/attendance/employee/${employeeId}/monthly?month=${month}&year=${year}`);
  }

  // ==================== LEAVES ====================
  async getLeaveRequests(filters?: { employeeId?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<LeaveRequest>> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return this.get<PaginatedResponse<LeaveRequest>>(`/leaves?${params.toString()}`);
  }

  async getLeaveBalance(employeeId: string): Promise<LeaveBalance[]> {
    return this.get<LeaveBalance[]>(`/leaves/balance/${employeeId}`);
  }

  async createLeaveRequest(data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return this.post<LeaveRequest>('/leaves', data);
  }

  async approveLeave(id: string, approved: boolean): Promise<LeaveRequest> {
    return this.patch<LeaveRequest>(`/leaves/${id}/approve`, { approved });
  }

  // ==================== PAYROLL ====================
  async getPayrollPeriods(): Promise<PayrollPeriod[]> {
    return this.get<PayrollPeriod[]>('/payroll/periods');
  }

  async getPayrollPeriod(id: string): Promise<PayrollPeriod> {
    return this.get<PayrollPeriod>(`/payroll/periods/${id}`);
  }

  async createPayrollPeriod(data: Partial<PayrollPeriod>): Promise<PayrollPeriod> {
    return this.post<PayrollPeriod>('/payroll/periods', data);
  }

  async getEmployeePayrolls(periodId: string): Promise<EmployeePayroll[]> {
    return this.get<EmployeePayroll[]>(`/payroll/periods/${periodId}/employees`);
  }

  async updateEmployeePayroll(id: string, data: Partial<EmployeePayroll>): Promise<EmployeePayroll> {
    return this.patch<EmployeePayroll>(`/payroll/employees/${id}`, data);
  }

  async processPayroll(periodId: string): Promise<void> {
    return this.post<void>(`/payroll/periods/${periodId}/process`);
  }

  async recalculatePayroll(periodId: string): Promise<void> {
    return this.post<void>(`/payroll/periods/${periodId}/recalculate`);
  }

  async closePayroll(periodId: string): Promise<void> {
    return this.patch<void>(`/payroll/periods/${periodId}/close`);
  }

  async generatePayslip(periodId: string, employeeId: string): Promise<Blob> {
    const response = await this.client.get(`/payroll/periods/${periodId}/employees/${employeeId}/payslip`, { responseType: 'blob' });
    return response.data;
  }

  async getPayslipData(periodId: string, employeeId: string): Promise<PayslipData> {
    return this.get<PayslipData>(`/payroll/periods/${periodId}/employees/${employeeId}/payslip-data`);
  }

  async reversePayroll(periodId: string): Promise<void> {
    return this.post<void>(`/payroll/periods/${periodId}/reverse`);
  }

  // ==================== CRM LEADS ====================
  async getLeads(filters?: { search?: string; source?: string; status?: string; assignedTo?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Lead>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return this.get<PaginatedResponse<Lead>>(`/crm/leads?${params.toString()}`);
  }

  async getLead(id: string): Promise<Lead> {
    return this.get<Lead>(`/crm/leads/${id}`);
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
    return this.post<Lead>('/crm/leads', data);
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    return this.put<Lead>(`/crm/leads/${id}`, data);
  }

  async deleteLead(id: string): Promise<void> {
    return this.delete<void>(`/crm/leads/${id}`);
  }

  async convertLead(id: string, data: Partial<Customer>): Promise<Customer> {
    return this.post<Customer>(`/crm/leads/${id}/convert`, data);
  }

  async updateLeadStatus(id: string, status: string): Promise<Lead> {
    return this.patch<Lead>(`/crm/leads/${id}/status`, { status });
  }

  // ==================== CRM ACTIVITIES ====================
  async getActivities(filters?: { type?: string; status?: string; assignedTo?: string; relatedTo?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Activity>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.relatedTo) params.append('relatedTo', filters.relatedTo);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return this.get<PaginatedResponse<Activity>>(`/crm/activities?${params.toString()}`);
  }

  async createActivity(data: Partial<Activity>): Promise<Activity> {
    return this.post<Activity>('/crm/activities', data);
  }

  async updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
    return this.put<Activity>(`/crm/activities/${id}`, data);
  }

  async markActivityComplete(id: string): Promise<Activity> {
    return this.patch<Activity>(`/crm/activities/${id}/complete`);
  }

  // ==================== LOGISTICS VEHICLES ====================
  async getVehicles(filters?: { search?: string; type?: string; status?: string; fuelType?: string; branch?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Vehicle>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fuelType) params.append('fuelType', filters.fuelType);
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return this.get<PaginatedResponse<Vehicle>>(`/logistics/vehicles?${params.toString()}`);
  }

  async getVehicle(id: string): Promise<Vehicle> {
    return this.get<Vehicle>(`/logistics/vehicles/${id}`);
  }

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    return this.post<Vehicle>('/logistics/vehicles', data);
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.put<Vehicle>(`/logistics/vehicles/${id}`, data);
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.delete<void>(`/logistics/vehicles/${id}`);
  }

  // ==================== LOGISTICS DRIVERS ====================
  async getDrivers(filters?: { search?: string; status?: string; branch?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Driver>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return this.get<PaginatedResponse<Driver>>(`/logistics/drivers?${params.toString()}`);
  }

  async getDriver(id: string): Promise<Driver> {
    return this.get<Driver>(`/logistics/drivers/${id}`);
  }

  async createDriver(data: Partial<Driver>): Promise<Driver> {
    return this.post<Driver>('/logistics/drivers', data);
  }

  async updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
    return this.put<Driver>(`/logistics/drivers/${id}`, data);
  }

  async deleteDriver(id: string): Promise<void> {
    return this.delete<void>(`/logistics/drivers/${id}`);
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return this.get<Driver[]>('/logistics/drivers/available');
  }

  // ==================== LOGISTICS TRIPS ====================
  async getTrips(filters?: { type?: string; status?: string; vehicleId?: string; driverId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Trip>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return this.get<PaginatedResponse<Trip>>(`/logistics/trips?${params.toString()}`);
  }

  async getTrip(id: string): Promise<Trip> {
    return this.get<Trip>(`/logistics/trips/${id}`);
  }

  async createTrip(data: Partial<Trip>): Promise<Trip> {
    return this.post<Trip>('/logistics/trips', data);
  }

  async updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
    return this.put<Trip>(`/logistics/trips/${id}`, data);
  }

  async startTrip(id: string): Promise<Trip> {
    return this.patch<Trip>(`/logistics/trips/${id}/start`);
  }

  async completeTrip(id: string): Promise<Trip> {
    return this.patch<Trip>(`/logistics/trips/${id}/complete`);
  }

  async cancelTrip(id: string): Promise<Trip> {
    return this.patch<Trip>(`/logistics/trips/${id}/cancel`);
  }

  // ==================== FUEL LOGS ====================
  async getFuelLogs(vehicleId: string): Promise<FuelLog[]> {
    return this.get<FuelLog[]>(`/logistics/vehicles/${vehicleId}/fuel-logs`);
  }

  async createFuelLog(vehicleId: string, data: Partial<FuelLog>): Promise<FuelLog> {
    return this.post<FuelLog>(`/logistics/vehicles/${vehicleId}/fuel-logs`, data);
  }

  async getFuelEfficiency(vehicleId: string): Promise<{ avgConsumption: number; totalCost: number; totalDistance: number }> {
    return this.get<{ avgConsumption: number; totalCost: number; totalDistance: number }>(`/logistics/vehicles/${vehicleId}/fuel-efficiency`);
  }

  // ==================== MAINTENANCE ====================
  async getMaintenanceRecords(filters?: { vehicleId?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<MaintenanceRecord>> {
    const params = new URLSearchParams();
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    return this.get<PaginatedResponse<MaintenanceRecord>>(`/logistics/maintenance?${params.toString()}`);
  }

  async createMaintenanceRecord(data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    return this.post<MaintenanceRecord>('/logistics/maintenance', data);
  }

  async getUpcomingMaintenance(): Promise<MaintenanceRecord[]> {
    return this.get<MaintenanceRecord[]>('/logistics/maintenance/upcoming');
  }

  // ==================== DASHBOARDS ====================
  async getHRDashboard(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    onLeave: number;
    attendanceRate: number;
    openPositions: number;
    payrollThisMonth: number;
    departmentDistribution: { name: string; value: number }[];
    genderDistribution: { name: string; value: number }[];
    statusDistribution: { name: string; value: number }[];
    recentAttendance: AttendanceSummary;
    upcomingBirthdays: { name: string; date: string; department: string }[];
    upcomingAnniversaries: { name: string; date: string; years: number }[];
    pendingLeaveRequests: LeaveRequest[];
    currentPayrollPeriod: PayrollPeriod;
  }> {
    return this.get('/dashboards/hr');
  }

  async getCRMDashboard(): Promise<{
    totalLeads: number;
    newLeadsThisMonth: number;
    conversionRate: number;
    wonDealsValue: number;
    pendingActivities: number;
    leadSourceBreakdown: { name: string; value: number }[];
    leadStatusDistribution: { name: string; value: number }[];
    topSalesReps: { name: string; deals: number; value: number }[];
    recentActivities: Activity[];
    overdueActivities: Activity[];
  }> {
    return this.get('/dashboards/crm');
  }

  async getLogisticsDashboard(): Promise<{
    activeTrips: number;
    todayDeliveries: number;
    pendingDeliveries: number;
    availableVehicles: number;
    availableDrivers: number;
    fuelCostToday: number;
    vehicleStatusDistribution: { name: string; value: number }[];
    tripStatusDistribution: { name: string; value: number }[];
    recentTrips: Trip[];
    fuelConsumptionTrend: { date: string; cost: number; liters: number }[];
    maintenanceAlerts: MaintenanceRecord[];
    deliveryPerformance: { onTime: number; delayed: number; total: number };
  }> {
    return this.get('/dashboards/logistics');
  }
}

export const apiService = new ApiService();
export default apiService;
