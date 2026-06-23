import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        });
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token)
                config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        });
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data.data;
    }
    async patch(url, data, config) {
        const response = await this.client.patch(url, data, config);
        return response.data.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data.data;
    }
    // ==================== EMPLOYEES ====================
    async getEmployees(filters) {
        const params = new URLSearchParams();
        if (filters?.search)
            params.append('search', filters.search);
        if (filters?.department)
            params.append('department', filters.department);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.branch)
            params.append('branch', filters.branch);
        if (filters?.jobTitle)
            params.append('jobTitle', filters.jobTitle);
        if (filters?.page)
            params.append('page', String(filters.page));
        if (filters?.limit)
            params.append('limit', String(filters.limit));
        return this.get(`/employees?${params.toString()}`);
    }
    async getEmployee(id) {
        return this.get(`/employees/${id}`);
    }
    async createEmployee(data) {
        return this.post('/employees', data);
    }
    async updateEmployee(id, data) {
        return this.put(`/employees/${id}`, data);
    }
    async deleteEmployee(id) {
        return this.delete(`/employees/${id}`);
    }
    async exportEmployees(filters) {
        const params = new URLSearchParams();
        if (filters?.search)
            params.append('search', filters.search);
        if (filters?.department)
            params.append('department', filters.department);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.branch)
            params.append('branch', filters.branch);
        const response = await this.client.get(`/employees/export?${params.toString()}`, { responseType: 'blob' });
        return response.data;
    }
    async getDepartments() {
        return this.get('/employees/departments');
    }
    async getJobTitles() {
        return this.get('/employees/job-titles');
    }
    async getBranches() {
        return this.get('/employees/branches');
    }
    async getSupervisors() {
        return this.get('/employees/supervisors');
    }
    // ==================== ATTENDANCE ====================
    async getAttendance(filters) {
        const params = new URLSearchParams();
        if (filters?.date)
            params.append('date', filters.date);
        if (filters?.branch)
            params.append('branch', filters.branch);
        if (filters?.department)
            params.append('department', filters.department);
        if (filters?.employeeId)
            params.append('employeeId', filters.employeeId);
        if (filters?.startDate)
            params.append('startDate', filters.startDate);
        if (filters?.endDate)
            params.append('endDate', filters.endDate);
        return this.get(`/attendance?${params.toString()}`);
    }
    async getAttendanceSummary(filters) {
        const params = new URLSearchParams();
        if (filters?.date)
            params.append('date', filters.date);
        if (filters?.branch)
            params.append('branch', filters.branch);
        if (filters?.department)
            params.append('department', filters.department);
        return this.get(`/attendance/summary?${params.toString()}`);
    }
    async updateAttendance(id, data) {
        return this.patch(`/attendance/${id}`, data);
    }
    async bulkAttendance(data) {
        return this.post('/attendance/bulk', data);
    }
    async getEmployeeMonthlyAttendance(employeeId, month, year) {
        return this.get(`/attendance/employee/${employeeId}/monthly?month=${month}&year=${year}`);
    }
    // ==================== LEAVES ====================
    async getLeaveRequests(filters) {
        const params = new URLSearchParams();
        if (filters?.employeeId)
            params.append('employeeId', filters.employeeId);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.page)
            params.append('page', String(filters.page));
        if (filters?.limit)
            params.append('limit', String(filters.limit));
        return this.get(`/leaves?${params.toString()}`);
    }
    async getLeaveBalance(employeeId) {
        return this.get(`/leaves/balance/${employeeId}`);
    }
    async createLeaveRequest(data) {
        return this.post('/leaves', data);
    }
    async approveLeave(id, approved) {
        return this.patch(`/leaves/${id}/approve`, { approved });
    }
    // ==================== PAYROLL ====================
    async getPayrollPeriods() {
        return this.get('/payroll/periods');
    }
    async getPayrollPeriod(id) {
        return this.get(`/payroll/periods/${id}`);
    }
    async createPayrollPeriod(data) {
        return this.post('/payroll/periods', data);
    }
    async getEmployeePayrolls(periodId) {
        return this.get(`/payroll/periods/${periodId}/employees`);
    }
    async updateEmployeePayroll(id, data) {
        return this.patch(`/payroll/employees/${id}`, data);
    }
    async processPayroll(periodId) {
        return this.post(`/payroll/periods/${periodId}/process`);
    }
    async recalculatePayroll(periodId) {
        return this.post(`/payroll/periods/${periodId}/recalculate`);
    }
    async closePayroll(periodId) {
        return this.patch(`/payroll/periods/${periodId}/close`);
    }
    async generatePayslip(periodId, employeeId) {
        const response = await this.client.get(`/payroll/periods/${periodId}/employees/${employeeId}/payslip`, { responseType: 'blob' });
        return response.data;
    }
    async getPayslipData(periodId, employeeId) {
        return this.get(`/payroll/periods/${periodId}/employees/${employeeId}/payslip-data`);
    }
    async reversePayroll(periodId) {
        return this.post(`/payroll/periods/${periodId}/reverse`);
    }
    // ==================== CRM LEADS ====================
    async getLeads(filters) {
        const params = new URLSearchParams();
        if (filters?.search)
            params.append('search', filters.search);
        if (filters?.source)
            params.append('source', filters.source);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.assignedTo)
            params.append('assignedTo', filters.assignedTo);
        if (filters?.page)
            params.append('page', String(filters.page));
        if (filters?.limit)
            params.append('limit', String(filters.limit));
        return this.get(`/crm/leads?${params.toString()}`);
    }
    async getLead(id) {
        return this.get(`/crm/leads/${id}`);
    }
    async createLead(data) {
        return this.post('/crm/leads', data);
    }
    async updateLead(id, data) {
        return this.put(`/crm/leads/${id}`, data);
    }
    async deleteLead(id) {
        return this.delete(`/crm/leads/${id}`);
    }
    async convertLead(id, data) {
        return this.post(`/crm/leads/${id}/convert`, data);
    }
    async updateLeadStatus(id, status) {
        return this.patch(`/crm/leads/${id}/status`, { status });
    }
    // ==================== CRM ACTIVITIES ====================
    async getActivities(filters) {
        const params = new URLSearchParams();
        if (filters?.type)
            params.append('type', filters.type);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.assignedTo)
            params.append('assignedTo', filters.assignedTo);
        if (filters?.relatedTo)
            params.append('relatedTo', filters.relatedTo);
        if (filters?.page)
            params.append('page', String(filters.page));
        if (filters?.limit)
            params.append('limit', String(filters.limit));
        return this.get(`/crm/activities?${params.toString()}`);
    }
    async createActivity(data) {
        return this.post('/crm/activities', data);
    }
    async updateActivity(id, data) {
        return this.put(`/crm/activities/${id}`, data);
    }
    async markActivityComplete(id) {
        return this.patch(`/crm/activities/${id}/complete`);
    }
    // ==================== LOGISTICS VEHICLES ====================
    async getVehicles(filters) {
        const params = new URLSearchParams();
        if (filters?.search)
            params.append('search', filters.search);
        if (filters?.type)
            params.append('type', filters.type);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.fuelType)
            params.append('fuelType', filters.fuelType);
        if (filters?.branch)
            params.append('branch', filters.branch);
        if (filters?.page)
            params.append('page', String(filters.page));
        if (filters?.limit)
            params.append('limit', String(filters.limit));
        return this.get(`/logistics/vehicles?${params.toString()}`);
    }
    async getVehicle(id) {
        return this.get(`/logistics/vehicles/${id}`);
    }
    async createVehicle(data) {
        return this.post('/logistics/vehicles', data);
    }
    async updateVehicle(id, data) {
        return this.put(`/logistics/vehicles/${id}`, data);
    }
    async deleteVehicle(id) {
        return this.delete(`/logistics/vehicles/${id}`);
    }
    // ==================== LOGISTICS DRIVERS ====================
    async getDrivers(filters) {
        const params = new URLSearchParams();
        if (filters?.search)
            params.append('search', filters.search);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.branch)
            params.append('branch', filters.branch);
        if (filters?.page)
            params.append('page', String(filters.page));
        if (filters?.limit)
            params.append('limit', String(filters.limit));
        return this.get(`/logistics/drivers?${params.toString()}`);
    }
    async getDriver(id) {
        return this.get(`/logistics/drivers/${id}`);
    }
    async createDriver(data) {
        return this.post('/logistics/drivers', data);
    }
    async updateDriver(id, data) {
        return this.put(`/logistics/drivers/${id}`, data);
    }
    async deleteDriver(id) {
        return this.delete(`/logistics/drivers/${id}`);
    }
    async getAvailableDrivers() {
        return this.get('/logistics/drivers/available');
    }
    // ==================== LOGISTICS TRIPS ====================
    async getTrips(filters) {
        const params = new URLSearchParams();
        if (filters?.type)
            params.append('type', filters.type);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.vehicleId)
            params.append('vehicleId', filters.vehicleId);
        if (filters?.driverId)
            params.append('driverId', filters.driverId);
        if (filters?.startDate)
            params.append('startDate', filters.startDate);
        if (filters?.endDate)
            params.append('endDate', filters.endDate);
        if (filters?.page)
            params.append('page', String(filters.page));
        if (filters?.limit)
            params.append('limit', String(filters.limit));
        return this.get(`/logistics/trips?${params.toString()}`);
    }
    async getTrip(id) {
        return this.get(`/logistics/trips/${id}`);
    }
    async createTrip(data) {
        return this.post('/logistics/trips', data);
    }
    async updateTrip(id, data) {
        return this.put(`/logistics/trips/${id}`, data);
    }
    async startTrip(id) {
        return this.patch(`/logistics/trips/${id}/start`);
    }
    async completeTrip(id) {
        return this.patch(`/logistics/trips/${id}/complete`);
    }
    async cancelTrip(id) {
        return this.patch(`/logistics/trips/${id}/cancel`);
    }
    // ==================== FUEL LOGS ====================
    async getFuelLogs(vehicleId) {
        return this.get(`/logistics/vehicles/${vehicleId}/fuel-logs`);
    }
    async createFuelLog(vehicleId, data) {
        return this.post(`/logistics/vehicles/${vehicleId}/fuel-logs`, data);
    }
    async getFuelEfficiency(vehicleId) {
        return this.get(`/logistics/vehicles/${vehicleId}/fuel-efficiency`);
    }
    // ==================== MAINTENANCE ====================
    async getMaintenanceRecords(filters) {
        const params = new URLSearchParams();
        if (filters?.vehicleId)
            params.append('vehicleId', filters.vehicleId);
        if (filters?.status)
            params.append('status', filters.status);
        if (filters?.page)
            params.append('page', String(filters.page));
        if (filters?.limit)
            params.append('limit', String(filters.limit));
        return this.get(`/logistics/maintenance?${params.toString()}`);
    }
    async createMaintenanceRecord(data) {
        return this.post('/logistics/maintenance', data);
    }
    async getUpcomingMaintenance() {
        return this.get('/logistics/maintenance/upcoming');
    }
    // ==================== DASHBOARDS ====================
    async getHRDashboard() {
        return this.get('/dashboards/hr');
    }
    async getCRMDashboard() {
        return this.get('/dashboards/crm');
    }
    async getLogisticsDashboard() {
        return this.get('/dashboards/logistics');
    }
}
export const apiService = new ApiService();
export default apiService;
