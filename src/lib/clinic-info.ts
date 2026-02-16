export function getClinicInfo() {
  return {
    name: process.env.CLINIC_NAME || 'Новая Я',
    phone: process.env.CLINIC_PHONE || '',
    address: process.env.CLINIC_ADDRESS || '',
    website: process.env.CLINIC_WEBSITE || '',
    email: process.env.CLINIC_EMAIL || '',
  };
}
