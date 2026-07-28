import api from './api';

export async function generatePayslip(formData) {
  const response = await api.post('/payroll/payslips/generate', formData, {
    responseType: 'blob',
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'payslip.pdf')
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const createPayRun = async (employeeIds, payPeriod) => {
  const response = await api.post('/payroll/payruns', { employeeIds, payPeriod });
  return response.data;
};

export const downloadPayslipPDF = async (payslipId) => {
  const response = await api.get(`/payroll/payslips/${payslipId}/pdf`, {
    responseType: 'blob',
  });
  return response;
};
