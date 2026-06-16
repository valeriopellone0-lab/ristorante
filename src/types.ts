export interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:MM
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  createdAt: any; // Timestamp di Firestore
  updatedAt?: any; // Timestamp di Firestore
}

export type MenuCategory = 'antipasti' | 'primi' | 'secondi' | 'dolci' | 'bevande';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  available: boolean;
  createdAt: any; // Timestamp di Firestore
  updatedAt?: any; // Timestamp di Firestore
}
