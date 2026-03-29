import { apiClient } from './apiClient';

export interface ContactFormData {
  name: string;
  email: string;
  inquiryType: string;
  message: string;
}

export const saveContactMessage = async (formData: ContactFormData): Promise<string> => {
  if (!formData.name || !formData.email || !formData.message) {
    throw new Error('All fields are required');
  }

  const payload = {
    id: crypto.randomUUID(),
    name: formData.name.trim(),
    email: formData.email.toLowerCase().trim(),
    message: formData.message.trim(),
    inquiryType: formData.inquiryType || 'General Inquiry',
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await apiClient.post('contactRequest', payload);
  return result.id;
};
