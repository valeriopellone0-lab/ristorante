import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Users, 
  ChefHat, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  LogIn, 
  LogOut, 
  Utensils, 
  BookOpen, 
  ShieldCheck, 
  Search, 
  MessageSquare, 
  Phone, 
  Mail, 
  User as UserIcon, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Info, 
  Lock, 
  AlertCircle, 
  X 
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Booking, MenuItem, MenuCategory } from './types';
import { DEFAULT_MENU } from './defaultMenu';

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<'menu' | 'book' | 'search'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'all'>('all');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Custom Admin Authentication States (e.g. admin / admin)
  const [isCustomAdmin, setIsCustomAdmin] = useState<boolean>(() => {
    return localStorage.getItem('isCustomAdmin') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');

  // Core Data States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);

  // Form States - Booking creation
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    date: '',
    time: '20:00',
    guests: 2,
    notes: ''
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [lastCreatedBooking, setLastCreatedBooking] = useState<Booking | null>(null);

  // Look-up Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchedBooking, setSearchedBooking] = useState<Booking | null>(null);
  const [searchAttempted, setSearchAttempted] = useState<boolean>(false);
  const [searchingLoading, setSearchingLoading] = useState<boolean>(false);

  // Form States - Menu Modification/Creation
  const [isAddingDish, setIsAddingDish] = useState<boolean>(false);
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'primi' as MenuCategory,
    available: true
  });

  // Demo fallback simulation states (for non-owner reviewers trying the admin panel)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [simulatedBookings, setSimulatedBookings] = useState<Booking[]>([
    {
      id: "BK-8291",
      customerName: "Alessandro Neri",
      email: "alessandro.neri@example.com",
      phone: "+39 333 456 7890",
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // domani
      time: "20:30",
      guests: 4,
      status: "pending",
      notes: "Tavolo vicino alla vetrata, se disponibile. Grazie!",
      createdAt: new Date()
    },
    {
      id: "BK-4219",
      customerName: "Chiara Moretti",
      email: "chiara.moretti@gmail.com",
      phone: "+39 347 112 2334",
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // dopodomani
      time: "13:15",
      guests: 2,
      status: "confirmed",
      notes: "Festeggiamo un anniversario speciale.",
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: "BK-5102",
      customerName: "Marco Rossi",
      email: "m.rossi@outlook.it",
      phone: "+39 320 987 6543",
      date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
      time: "21:00",
      guests: 6,
      status: "cancelled",
      notes: "Un ospite necessita di opzioni senza glutine.",
      createdAt: new Date(Date.now() - 7200000)
    }
  ]);
  const [simulatedMenuItems, setSimulatedMenuItems] = useState<MenuItem[]>(
    DEFAULT_MENU.map((item, idx) => ({
      ...item,
      id: `SIM-MENU-${idx}`,
      createdAt: new Date()
    })) as MenuItem[]
  );

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Utility toast dispatcher
  const triggerNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Check if current authenticated user is the true Owner (either via admin credentials or matching Google login)
  const isOwner = useMemo(() => {
    return isCustomAdmin || (currentUser !== null && currentUser.email === 'valeriopellone0@gmail.com');
  }, [currentUser, isCustomAdmin]);

  // Auth subscription & custom admin session syncing
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      if (user) {
        if (user.email === 'valeriopellone0@gmail.com') {
          setIsDemoMode(false);
          triggerNotification("Benvenuto, Amministratore!", "success");
        } else {
          setIsDemoMode(true);
          triggerNotification(`Accesso Ospite. Attivata la simulazione Demo.`, "info");
        }
      } else {
        setIsDemoMode(isCustomAdmin);
      }
    });
    return () => unsubscribe();
  }, [isCustomAdmin]);

  // Real-time Database Subscription: Menu
  useEffect(() => {
    const q = query(collection(db, 'menuItems'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbItems: MenuItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        dbItems.push({ 
          id: doc.id, 
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          available: data.available ?? true,
          createdAt: data.createdAt
        } as MenuItem);
      });
      setMenuItems(dbItems);
      setLoadingMenu(false);
    }, (error) => {
      console.warn("Lettura Firestore limitata, fallback locale o demo:", error.message);
      setMenuItems([]);
      setLoadingMenu(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Database Subscription: Bookings (Only for true administrator)
  useEffect(() => {
    if (!currentUser || currentUser.email !== 'valeriopellone0@gmail.com') {
      setBookings([]);
      setLoadingBookings(false);
      return;
    }

    setLoadingBookings(true);
    const q = query(collection(db, 'bookings'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbBookings: Booking[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        dbBookings.push({ 
          id: doc.id, 
          customerName: data.customerName,
          email: data.email,
          phone: data.phone,
          date: data.date,
          time: data.time,
          guests: data.guests,
          status: data.status,
          notes: data.notes,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Booking);
      });
      setBookings(dbBookings);
      setLoadingBookings(false);
    }, (error) => {
      console.error("Errore lettura prenotazioni in tempo reale:", error);
      setLoadingBookings(false);
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle Google Login
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Errore login Google:", error);
      triggerNotification("Impossibile accedere con Google. Riprova.", "error");
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (isCustomAdmin) {
      setIsCustomAdmin(false);
      localStorage.removeItem('isCustomAdmin');
      setIsDemoMode(false);
      triggerNotification("Sei uscito correttamente.", "success");
      return;
    }

    try {
      await signOut(auth);
      setIsDemoMode(false);
      triggerNotification("Sei uscito correttamente.", "success");
    } catch (error) {
      console.error("Errore disconnessione:", error);
    }
  };

  // Handle Admin Credentials Login (Username & Password: admin/admin)
  const handleAdminCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername.trim() === 'admin' && adminPassword === 'admin') {
      setIsCustomAdmin(true);
      localStorage.setItem('isCustomAdmin', 'true');
      setIsDemoMode(true);
      triggerNotification("Accesso effettuato come Amministratore!", "success");
      setAdminUsername('');
      setAdminPassword('');
    } else {
      triggerNotification("Credenziali admin non corrette. Riprova.", "error");
    }
  };

  // Seeding Default Menu Items to Firestore
  const handleSeedMenu = async () => {
    if (!isOwner) {
      triggerNotification("Solo l'amministratore può salvare nel database reale! Simulo in locale.", "info");
      setSimulatedMenuItems(
        DEFAULT_MENU.map((item, idx) => ({
          ...item,
          id: `SIM-MENU-${idx}-${Date.now()}`,
          createdAt: new Date()
        })) as MenuItem[]
      );
      return;
    }

    setLoadingMenu(true);
    try {
      for (const item of DEFAULT_MENU) {
        const itemRef = doc(collection(db, 'menuItems'));
        await setDoc(itemRef, {
          ...item,
          id: itemRef.id,
          createdAt: serverTimestamp()
        });
      }
      triggerNotification("Menù inizializzato sul database reale!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'menuItems');
    } finally {
      setLoadingMenu(false);
    }
  };

  // Submitting a new Customer Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.customerName || !bookingForm.email || !bookingForm.phone || !bookingForm.date || !bookingForm.time || !bookingForm.guests) {
      triggerNotification("Compila tutti i campi richiesti.", "error");
      return;
    }

    setIsSubmittingBooking(true);
    const bookingCode = `TR-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Omit<Booking, 'createdAt'> = {
      id: bookingCode,
      customerName: bookingForm.customerName.trim(),
      email: bookingForm.email.trim(),
      phone: bookingForm.phone.trim(),
      date: bookingForm.date,
      time: bookingForm.time,
      guests: Number(bookingForm.guests),
      status: 'pending',
      notes: bookingForm.notes.trim()
    };

    try {
      // Create real document in Firestore
      const bookingRef = doc(db, 'bookings', bookingCode);
      await setDoc(bookingRef, {
        ...newBooking,
        createdAt: serverTimestamp()
      });

      const clientWithTimestamp: Booking = {
        ...newBooking,
        createdAt: new Date()
      };
      setLastCreatedBooking(clientWithTimestamp);
      triggerNotification("Tavolo prenotato con successo!", "success");

      // Reset form
      setBookingForm({
        customerName: '',
        email: '',
        phone: '',
        date: '',
        time: '20:00',
        guests: 2,
        notes: ''
      });
    } catch (error) {
      console.warn("Impossibile salvare sul DB reale (forse offline o quota). Procedo alla prenotazione locale nella demo.", error);
      
      // Fallback local simulation
      const clientWithTimestamp: Booking = {
        ...newBooking,
        createdAt: new Date()
      };
      setSimulatedBookings(prev => [clientWithTimestamp, ...prev]);
      setLastCreatedBooking(clientWithTimestamp);
      triggerNotification("Prenotazione salvata in modalità demo locale!", "success");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Booking search lookup
  const handleSearchBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchingLoading(true);
    setSearchAttempted(true);

    const formattedQuery = searchQuery.trim().toUpperCase();

    // Strategy 1: Check simulated local array if database is offline or user is in non-owner demo
    const localMatch = simulatedBookings.find(b => b.id === formattedQuery || b.email.toLowerCase() === formattedQuery.toLowerCase());
    
    // Strategy 2: Attempt Firestore direct document lookup if format looks like ID (TR-XXXX)
    if (formattedQuery.startsWith('TR-')) {
      try {
        const docRef = doc(db, 'bookings', formattedQuery);
        // Note: rule allows read(get) on single documents
        onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSearchedBooking({ id: docSnap.id, ...data } as Booking);
          } else if (localMatch) {
            setSearchedBooking(localMatch);
          } else {
            setSearchedBooking(null);
          }
          setSearchingLoading(false);
        }, () => {
          if (localMatch) {
            setSearchedBooking(localMatch);
          } else {
            setSearchedBooking(null);
          }
          setSearchingLoading(false);
        });
        return;
      } catch (err) {
        console.warn("Firestore lookup failed, relying on local search", err);
      }
    }

    // Default to search in simulated/local arrays
    setSearchedBooking(localMatch || null);
    setSearchingLoading(false);
  };

  // ADMIN ACTION: Confirm or Cancel a Booking
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    if (isDemoMode) {
      // Simulate locally
      setSimulatedBookings(prev => 
        prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
      );
      triggerNotification(`[Simolazione] Prenotazione ${bookingId} impostata su ${newStatus === 'confirmed' ? 'Confermata' : 'Cancellata'}.`, "success");
      return;
    }

    if (!isOwner) return;

    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      triggerNotification(`Prenotazione ${bookingId} aggiornata con successo!`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  // ADMIN ACTION: Toggle Menu Item Availability
  const handleToggleAvailability = async (itemId: string, currentVal: boolean) => {
    if (isDemoMode) {
      setSimulatedMenuItems(prev =>
        prev.map(item => item.id === itemId ? { ...item, available: !currentVal } : item)
      );
      triggerNotification(`[Simolazione] Disponibilità piatto aggiornata.`, "success");
      return;
    }

    if (!isOwner) return;

    try {
      const docRef = doc(db, 'menuItems', itemId);
      await updateDoc(docRef, {
        available: !currentVal,
        updatedAt: serverTimestamp()
      });
      triggerNotification("Disponibilità piatto salvata!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `menuItems/${itemId}`);
    }
  };

  // ADMIN ACTION: Delete a Menu Item
  const handleDeleteMenuItem = async (itemId: string) => {
    if (isDemoMode) {
      setSimulatedMenuItems(prev => prev.filter(item => item.id !== itemId));
      triggerNotification("[Simolazione] Piatto rimosso perfettamente.", "success");
      return;
    }

    if (!isOwner) return;

    try {
      const docRef = doc(db, 'menuItems', itemId);
      await deleteDoc(docRef);
      triggerNotification("Il piatto è stato rimosso dal menù.", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `menuItems/${itemId}`);
    }
  };

  // ADMIN ACTION: Create new Menu Item
  const handleAddDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name || !dishForm.price) {
      triggerNotification("Compila i campi richiesti.", "error");
      return;
    }

    const priceNum = parseFloat(dishForm.price);
    if (isNaN(priceNum) || priceNum < 0) {
      triggerNotification("Il prezzo inserito non è valido.", "error");
      return;
    }

    const uniqueId = `DI-${Date.now()}`;
    const newDish = {
      name: dishForm.name.trim(),
      description: dishForm.description.trim(),
      price: priceNum,
      category: dishForm.category,
      available: dishForm.available
    };

    if (isDemoMode) {
      const simulatedDish: MenuItem = {
        id: uniqueId,
        ...newDish,
        createdAt: new Date()
      };
      setSimulatedMenuItems(prev => [...prev, simulatedDish]);
      setIsAddingDish(false);
      setDishForm({ name: '', description: '', price: '', category: 'primi', available: true });
      triggerNotification("[Simolazione] Nuovo piatto inserito!", "success");
      return;
    }

    if (!isOwner) return;

    try {
      const itemRef = doc(db, 'menuItems', uniqueId);
      await setDoc(itemRef, {
        ...newDish,
        id: uniqueId,
        createdAt: serverTimestamp()
      });
      setIsAddingDish(false);
      setDishForm({ name: '', description: '', price: '', category: 'primi', available: true });
      triggerNotification("Nuovo piatto aggiunto nel database reale!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `menuItems/${uniqueId}`);
    }
  };

  // Active Menu list source based on environment
  const filteredMenuItems = useMemo(() => {
    const list = menuItems.length > 0 ? menuItems : simulatedMenuItems;
    if (selectedCategory === 'all') return list;
    return list.filter(item => item.category === selectedCategory);
  }, [menuItems, simulatedMenuItems, selectedCategory]);

  const activeBookingsList = useMemo(() => {
    return bookings.length > 0 ? bookings : simulatedBookings;
  }, [bookings, simulatedBookings]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] font-sans flex flex-col selection:bg-amber-100 selection:text-amber-900">
      
      {/* 1. Global Alert Banner for Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            id="toast-notification"
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full shadow-lg border text-sm font-medium flex items-center gap-2.5 backdrop-blur-md ${
              notification.type === 'success' 
                ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200' 
                : notification.type === 'error' 
                ? 'bg-rose-50/95 text-rose-800 border-rose-200' 
                : 'bg-amber-50/95 text-amber-800 border-amber-200'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top-bar Header with Branding Styled in Bento Theme */}
      <header id="header" className="max-w-6xl w-full mx-auto px-4 pt-8 pb-4 flex flex-col md:flex-row justify-between items-end border-b border-[#E5E5E0] gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-serif font-light italic tracking-tight text-[#4A4A3A]">
            La cucina di Elvira
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8C8C7A] mt-1">
            Cucina Casereccia & Specialità Tipiche
          </p>
        </div>
        
        {/* Main Navigation in Bento Style */}
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider font-bold">
          <button
            id="nav-menu"
            onClick={() => { setActiveTab('menu'); setShowAdminPanel(false); }}
            className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-1.5 ${
              activeTab === 'menu' && !showAdminPanel
                ? 'bg-[#5A5A40] text-white'
                : 'text-[#8C8C7A] hover:text-[#5A5A40]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Il Menù</span>
          </button>
          <button
            id="nav-book"
            onClick={() => { setActiveTab('book'); setShowAdminPanel(false); }}
            className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-1.5 ${
              activeTab === 'book' && !showAdminPanel
                ? 'bg-[#5A5A40] text-white'
                : 'text-[#8C8C7A] hover:text-[#5A5A40]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Prenota</span>
          </button>
          <button
            id="nav-search"
            onClick={() => { setActiveTab('search'); setShowAdminPanel(false); }}
            className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-1.5 ${
              activeTab === 'search' && !showAdminPanel
                ? 'bg-[#5A5A40] text-white'
                : 'text-[#8C8C7A] hover:text-[#5A5A40]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Controlla</span>
          </button>
          
          <div className="h-4 w-px bg-[#E5E5E0] mx-1 hidden sm:block"></div>

          {/* Backoffice Button with Lock Indicator */}
          <button
            id="nav-admin"
            onClick={() => { setShowAdminPanel(true); }}
            className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-1.5 border ${
              showAdminPanel
                ? 'bg-[#151619] text-white border-transparent'
                : 'border-[#E5E5E0] text-[#8C8C7A] hover:text-[#5A5A40]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gestione</span>
            {isOwner && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>}
          </button>
        </div>
      </header>

      {/* 3. Demo Activation Banner Warning Styled in Bento Theme */}
      {isDemoMode && (
        <div id="demo-banner" className="max-w-6xl w-full mx-auto px-4 mt-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs flex items-center gap-2.5 font-medium shadow-sm">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Modalità Demo Locale Attiva:</strong> Stai visualizzando i dati in simulazione poiché non sei registrato come amministratore principale ({'valeriopellone0@gmail.com'}). Tutte le modifiche saranno memorizzate in locale.
            </span>
          </div>
        </div>
      )}

      {/* 4. MAIN LAYOUT AND CORE FRAMES */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!showAdminPanel ? (
            <motion.div
              key="customer-flow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* --- CUSTOMER SECTION 1: MENÙ --- */}
              {activeTab === 'menu' && (
                <div id="customer-menu-tab" className="space-y-8">
                  {/* Overview Grid Header Card */}
                  <div className="bg-white rounded-3xl border border-[#E5E5E0] p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                    <div className="space-y-4 text-center md:text-left max-w-xl">
                      <div>
                        <h2 className="font-serif text-3xl italic text-[#4A4A3A]">
                          La cucina di Elvira
                        </h2>
                        <p className="text-[#8C8C7A] text-[10px] uppercase tracking-[0.2em] font-bold mt-1">
                          La Vera Cucina Casereccia & Pranzi Completi
                        </p>
                      </div>
                      <p className="text-sm text-[#8C8C7A] leading-relaxed">
                        Tutti i nostri piatti sono preparati sul momento secondo la tipica tradizione casereccia con ingredienti freschi di prima scelta ed immenso amore. Scopri anche le nostre convenienti formule Menù Completo e Piatto Ricco!
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 pt-2 text-[11px] font-semibold text-[#8C8C7A]">
                        <span className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E5E5E0] px-3 py-1.5 rounded-full shadow-sm">
                          📞 Tel: <strong className="text-[#4A4A3A] font-mono">338 933 8810</strong>
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E5E5E0] px-3 py-1.5 rounded-full shadow-sm">
                          📶 Wi-Fi: <strong className="text-[#4A4A3A]">Elvira29</strong>
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E5E5E0] px-3 py-1.5 rounded-full shadow-sm">
                          🔑 Pwd: <strong className="text-[#4A4A3A] font-mono">Elvira29</strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-[#FAF9F6] border border-[#E5E5E0] p-5 rounded-2xl text-center shrink-0 w-44 shadow-inner">
                      <span className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-[#5A5A40] bg-[#E5E5E0]/60 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-pulse"></span> Live Menu
                      </span>
                      <div className="text-2xl font-serif italic text-[#5A5A40] mt-3">Elvira29</div>
                      <div className="text-[9px] uppercase tracking-wider font-bold text-[#8C8C7A] mt-1">Password Wi-Fi</div>
                    </div>
                  </div>

                  {/* PROMOTION FORMULAS / COMBO SERVICES BENTO BAR */}
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Combo 1: Mart-Ven Formulazione */}
                    <div className="bg-white rounded-3xl border border-[#E5E5E0] p-6 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute right-0 top-0 bg-[#5A5A40] text-white text-[9px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl">
                        Mart - Ven
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-base italic text-[#4A4A3A] mt-2">Menù Completo Feriale</h4>
                        <p className="text-[10px] text-[#8C8C7A] uppercase font-bold tracking-wider">Antipasto/Contorno, Primo e Secondo del Giorno</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E5E0]">
                        <div>
                          <p className="text-[9px] uppercase text-[#8C8C7A] font-extrabold font-sans">Formula Terra</p>
                          <p className="font-serif text-lg italic text-[#1C1C1C]">15 € <span className="text-xs text-[#8C8C7A]">Terra</span></p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-[#8C8C7A] font-extrabold font-sans">Formula Mare</p>
                          <p className="font-serif text-lg italic text-[#1C1C1C]">20 € <span className="text-xs text-[#8C8C7A]">Mare</span></p>
                        </div>
                      </div>
                      <p className="text-[9px] text-[#8C8C7A] font-bold italic pt-1 border-t border-dashed border-[#E5E5E0] text-center">* BIBITE ESCLUSE</p>
                    </div>

                    {/* Combo 2: Fine Settimana Formulazione */}
                    <div className="bg-white rounded-3xl border border-[#E5E5E0] p-6 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute right-0 top-0 bg-[#5A5A40] text-white text-[9px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl">
                        Sab, Dom & Festivi
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-base italic text-[#4A4A3A] mt-2">Menù Fine Settimana</h4>
                        <p className="text-[10px] text-[#8C8C7A] uppercase font-bold tracking-wider">La grande festa dei sapori di Elvira</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E5E0]">
                        <div>
                          <p className="text-[9px] uppercase text-[#8C8C7A] font-extrabold font-sans">Formula Terra</p>
                          <p className="font-serif text-lg italic text-[#1C1C1C]">20 € <span className="text-xs text-[#8C8C7A]">Terra</span></p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-[#8C8C7A] font-extrabold font-sans">Formula Mare</p>
                          <p className="font-serif text-lg italic text-[#1C1C1C]">25 € <span className="text-xs text-[#8C8C7A]">Mare</span></p>
                        </div>
                      </div>
                      <p className="text-[9px] text-[#8C8C7A] font-bold italic pt-1 border-t border-dashed border-[#E5E5E0] text-center">* BIBITE ESCLUSE</p>
                    </div>

                    {/* Combo 3: Piatto Ricco Infocard */}
                    <div className="bg-[#FAF9F6] rounded-3xl border border-[#E5E5E0] p-6 shadow-sm flex flex-col justify-between space-y-2 col-span-1 sm:col-span-2 md:col-span-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] uppercase font-extrabold text-[#5A5A40]">
                          <span className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-pulse"></span> Selezione Speciale
                        </div>
                        <h4 className="font-serif text-base italic text-[#4A4A3A]">Piatto Ricco</h4>
                        <p className="text-xs text-[#8C8C7A] leading-relaxed">
                          Cerchi un'esperienza superlativa? Prova le nostre specialità "Piatto Ricco" (primo e secondo unito delizioso, come Paccheri al Baccalà o Linguine con Gamberoni!).
                        </p>
                      </div>
                      <span className="text-[9px] text-[#8C8C7A] uppercase tracking-wider font-extrabold mt-1">Disponibili a pranzo e cena</span>
                    </div>
                  </div>

                  {/* Menu Category Pills Styled beautifully with thin border */}
                  <div className="flex flex-wrap justify-center gap-2 py-1">
                    {(['all', 'antipasti', 'primi', 'secondi', 'dolci', 'bevande'] as const).map((cat) => (
                      <button
                        key={cat}
                        id={`filter-menu-${cat}`}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4.5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 border ${
                          selectedCategory === cat
                            ? 'bg-[#5A5A40] text-white border-transparent shadow-sm'
                            : 'bg-white hover:bg-[#F0EFEC] text-[#8C8C7A] border-[#E5E5E0]'
                        }`}
                      >
                        {cat === 'all' 
                          ? 'Tutti i piatti' 
                          : cat === 'antipasti' 
                          ? 'Antipasti & Contorni' 
                          : cat === 'primi' 
                          ? 'Primi Piatti' 
                          : cat === 'secondi' 
                          ? 'Secondi Piatti' 
                          : cat === 'dolci' 
                          ? 'Dolci d\'Elvira' 
                          : 'Bibite'}
                      </button>
                    ))}
                  </div>

                  {/* Menu Grid structured as Bento modules */}
                  {loadingMenu ? (
                    <div className="py-20 text-center text-[#8C8C7A] text-sm flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-[#5A5A40]/30 border-t-[#5A5A40] animate-spin"></div>
                      <p>Sincronizzazione dei piatti deliziosi in corso...</p>
                    </div>
                  ) : filteredMenuItems.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E5E0] space-y-4 max-w-md mx-auto shadow-sm">
                      <ChefHat className="w-12 h-12 text-[#8C8C7A] mx-auto opacity-65" />
                      <p className="text-[#8C8C7A] font-serif italic text-base">Nessun piatto disponibile in questa categoria.</p>
                      {isDemoMode && (
                        <button
                          onClick={handleSeedMenu}
                          className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A32] text-white text-xs font-semibold rounded-xl transition"
                        >
                          Inizializza Menù d'Esempio
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredMenuItems.map((dish) => (
                        <motion.div
                          layout
                          id={`dish-card-${dish.id}`}
                          key={dish.id}
                          className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col justify-between ${
                            dish.available ? 'border-[#E5E5E0]' : 'border-[#E5E5E0] opacity-75'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-baseline gap-4">
                              <h3 className={`font-serif text-lg font-medium italic ${dish.available ? 'text-[#1C1C1C]' : 'text-[#8C8C7A] line-through'}`}>
                                {dish.name}
                              </h3>
                              <span className={`font-mono text-sm font-semibold whitespace-nowrap shrink-0 ${dish.available ? 'text-[#5A5A40]' : 'text-[#8C8C7A]'}`}>
                                € {dish.price.toFixed(2)}
                              </span>
                            </div>
                            <p className={`text-xs leading-relaxed ${dish.available ? 'text-[#8C8C7A]' : 'text-[#8C8C7A]/75'}`}>
                              {dish.description}
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-dashed border-[#E5E5E0] flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-[#8C8C7A] font-mono">
                              {dish.category}
                            </span>
                            {!dish.available ? (
                              <span className="text-red-500 font-bold uppercase">
                                Esaurito per oggi
                              </span>
                            ) : (
                              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                                Disponibile
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- CUSTOMER SECTION 2: PRENOTAZIONI --- */}
              {activeTab === 'book' && (
                <div id="customer-book-tab" className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-white rounded-3xl border border-[#E5E5E0] p-6 text-center space-y-2">
                    <h2 className="font-serif text-3xl italic text-[#4A4A3A]">
                      Riserva il tuo Tavolo
                    </h2>
                    <p className="text-xs uppercase tracking-wider text-[#8C8C7A] font-bold">
                      Bistro Reservation Engine
                    </p>
                    <p className="text-xs text-[#8C8C7A] max-w-md mx-auto">
                      Scegli la data e l'ora desiderata. Riceverai un codice unico istantaneo per monitorare lo stato di approvazione della tua richiesta in tempo reale.
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {lastCreatedBooking ? (
                      /* Reservation Success Card */
                      <motion.div
                        key="book-success"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        id="booking-success-card"
                        className="bg-[#FAF9F6] rounded-3xl p-8 border border-green-200 shadow-sm space-y-6 text-center relative overflow-hidden"
                      >
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-green-600"></div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-700">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="font-serif text-2xl italic text-[#4A4A3A]">
                            Richiesta Ricevuta!
                          </h3>
                          <p className="text-[#8C8C7A] text-xs">
                            Il nostro staff verificherà la disponibilità in sala nel più breve tempo possibile.
                          </p>
                        </div>

                        {/* Booking Code Board */}
                        <div className="bg-white rounded-2xl p-6 border border-[#E5E5E0] max-w-sm mx-auto space-y-3 shadow-xs">
                          <p className="text-[#8C8C7A] font-sans text-[10px] tracking-widest uppercase font-bold">Codice di Verifica</p>
                          <p className="font-mono text-3xl font-extrabold text-[#5A5A40] tracking-wider">
                            {lastCreatedBooking.id}
                          </p>
                          <div className="h-px bg-[#E5E5E0] w-full"></div>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs text-[#1C1C1C]">
                            <div>
                              <p className="text-[#8C8C7A] text-[9px] uppercase font-bold">Ospiti</p>
                              <p className="font-bold mt-0.5">{lastCreatedBooking.guests}</p>
                            </div>
                            <div>
                              <p className="text-[#8C8C7A] text-[9px] uppercase font-bold">Data</p>
                              <p className="font-bold mt-0.5">{lastCreatedBooking.date}</p>
                            </div>
                            <div>
                              <p className="text-[#8C8C7A] text-[9px] uppercase font-bold">Orario</p>
                              <p className="font-bold mt-0.5">{lastCreatedBooking.time}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                          <button
                            onClick={() => {
                              setSearchQuery(lastCreatedBooking.id);
                              setActiveTab('search');
                              setLastCreatedBooking(null);
                            }}
                            className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A32] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all duration-300"
                          >
                            Verifica lo Stato
                          </button>
                          <button
                            onClick={() => setLastCreatedBooking(null)}
                            className="px-5 py-2.5 bg-white border border-[#E5E5E0] hover:bg-[#F0EFEC] text-[#8C8C7A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300"
                          >
                            Nuova Prenotazione
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* Reservation Form Table */
                      <motion.form
                        key="book-form"
                        onSubmit={handleCreateBooking}
                        id="booking-form"
                        className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E0] shadow-sm space-y-6 relative"
                      >
                        <div id="form-grid" className="grid sm:grid-cols-2 gap-5">
                          
                          {/* Name input */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider block">Nome e Cognome</label>
                            <div className="relative">
                              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C7A]" />
                              <input
                                type="text"
                                required
                                value={bookingForm.customerName}
                                onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                                placeholder="Esempio: Luigi Rossi"
                                className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-[#5A5A40] outline-none transition duration-200"
                              />
                            </div>
                          </div>

                          {/* Email input */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider block">E-mail di contatto</label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C7A]" />
                              <input
                                type="email"
                                required
                                value={bookingForm.email}
                                onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                                placeholder="nome@esempio.com"
                                className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-[#5A5A40] outline-none transition duration-200"
                              />
                            </div>
                          </div>

                          {/* Phone input */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider block">Recapito Telefonico</label>
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C7A]" />
                              <input
                                type="tel"
                                required
                                value={bookingForm.phone}
                                onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                                placeholder="+39 333 1234567"
                                className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-[#5A5A40] outline-none transition duration-200"
                              />
                            </div>
                          </div>

                          {/* Guests count select */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider block">Ospiti al Tavolo</label>
                            <div className="relative">
                              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C7A]" />
                              <select
                                required
                                value={bookingForm.guests}
                                onChange={(e) => setBookingForm({ ...bookingForm, guests: Number(e.target.value) })}
                                className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-[#5A5A40] outline-none transition duration-200 appearance-none"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                                  <option key={num} value={num}>
                                    {num} {num === 1 ? 'Persona' : 'Persone'}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Date input */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider block">Data Desiderata</label>
                            <div className="relative">
                              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C7A]" />
                              <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={bookingForm.date}
                                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                                className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-[#5A5A40] outline-none transition duration-200"
                              />
                            </div>
                          </div>

                          {/* Time select */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider block">Orario di Arrivo</label>
                            <div className="relative">
                              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C7A]" />
                              <select
                                required
                                value={bookingForm.time}
                                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                                className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-[#5A5A40] outline-none transition duration-200 appearance-none"
                              >
                                <optgroup label="Pranzo">
                                  <option value="12:30">12:30</option>
                                  <option value="13:00">13:00</option>
                                  <option value="13:30">13:30</option>
                                  <option value="14:00">14:00</option>
                                </optgroup>
                                <optgroup label="Cena">
                                  <option value="19:30">19:30</option>
                                  <option value="20:00">20:00</option>
                                  <option value="20:30">20:30</option>
                                  <option value="21:00">21:00</option>
                                  <option value="21:30">21:30</option>
                                  <option value="22:00">22:00</option>
                                </optgroup>
                              </select>
                            </div>
                          </div>

                        </div>

                        {/* Special requests/Notes */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider block">Note o intolleranze (Opzionale)</label>
                          <div className="relative">
                            <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8C8C7A]" />
                            <textarea
                              rows={3}
                              value={bookingForm.notes}
                              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                              placeholder="Esempio: Intolleranze alimentari, allergie, seggioloni per bambini..."
                              className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-[#5A5A40] outline-none transition duration-200 resize-none animate-none"
                            ></textarea>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmittingBooking}
                          className="w-full bg-[#5A5A40] hover:bg-[#4A4A32] text-white font-sans py-3.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
                        >
                          {isSubmittingBooking ? (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-slate-300/30 border-t-white animate-spin"></div>
                              <span>Inoltro in corso...</span>
                            </>
                          ) : (
                            <span>Richiedi Prenotazione</span>
                          )}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* --- CUSTOMER SECTION 3: CERCA PRENOTAZIONE --- */}
              {activeTab === 'search' && (
                <div id="customer-search-tab" className="max-w-md mx-auto space-y-6">
                  <div className="bg-white rounded-3xl border border-[#E5E5E0] p-6 text-center space-y-2">
                    <h2 className="font-serif text-3xl italic text-[#4A4A3A]">
                      Controlla lo Stato
                    </h2>
                    <p className="text-xs uppercase tracking-wider text-[#8C8C7A] font-bold">
                      Check Reservation Live Status
                    </p>
                    <p className="text-xs text-[#8C8C7A]">
                      Inserisci il codice di prenotazione per verificare l'assegnazione del tavolo e lo stato della conferma.
                    </p>
                  </div>

                  {/* Search Input Box */}
                  <form onSubmit={handleSearchBooking} className="bg-white rounded-2xl p-3 border border-[#E5E5E0] flex gap-2 shadow-xs">
                    <input
                      type="text"
                      required
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Codice (es. TR-8291)"
                      className="flex-1 bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl px-4 py-2 text-xs font-semibold uppercase focus:bg-white outline-none"
                    />
                    <button
                      type="submit"
                      disabled={searchingLoading}
                      className="px-5 bg-[#5A5A40] hover:bg-[#4A4A32] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      {searchingLoading ? 'Cerca...' : 'Cerca'}
                    </button>
                  </form>

                  {/* Search Result Card Container */}
                  <AnimatePresence mode="wait">
                    {searchAttempted && (
                      searchedBooking ? (
                        <motion.div
                          id="search-result-card"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="bg-white rounded-3xl p-6 border border-[#E5E5E0] shadow-sm space-y-5 relative overflow-hidden"
                        >
                          <div className={`absolute top-0 inset-x-0 h-1.5 ${
                            searchedBooking.status === 'confirmed' ? 'bg-green-600' :
                            searchedBooking.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                          }`}></div>

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[9px] uppercase font-bold tracking-wider text-[#8C8C7A]">Codice Identificativo</p>
                              <h4 className="font-mono text-lg font-bold text-[#1C1C1C]">{searchedBooking.id}</h4>
                            </div>
                            
                            {/* Color Coded Status Badge */}
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              searchedBooking.status === 'confirmed' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : searchedBooking.status === 'cancelled' 
                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {searchedBooking.status === 'confirmed' ? 'Confermata' :
                               searchedBooking.status === 'cancelled' ? 'Rifiutata' : 'In Attesa'}
                            </span>
                          </div>

                          <div className="h-px bg-[#E5E5E0]"></div>

                          {/* Info fields */}
                          <div className="space-y-3.5 text-xs text-[#1C1C1C]">
                            <div className="flex justify-between">
                              <span className="text-[#8C8C7A] font-medium">Nome Ospite</span>
                              <span className="font-bold">{searchedBooking.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#8C8C7A] font-medium">Coperti</span>
                              <span className="font-bold">{searchedBooking.guests} persone</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#8C8C7A] font-medium">Data & Orario</span>
                              <span className="font-bold font-mono">{searchedBooking.date} • {searchedBooking.time}</span>
                            </div>
                            {searchedBooking.notes && (
                              <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E5E0]">
                                <span className="text-[10px] font-bold text-[#8C8C7A] uppercase block mb-1">Mie note:</span>
                                <span className="italic text-[#8C8C7A]">"{searchedBooking.notes}"</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 text-center text-[10px] text-[#8C8C7A] font-semibold border-t border-[#E5E5E0] border-dashed">
                            Tavolo sincronizzato live
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          id="search-notfound-card"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200 text-center space-y-2 shadow-xs"
                        >
                          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                          <h4 className="font-serif text-base italic text-[#4A4A3A]">Nessuna Prenotazione Trovata</h4>
                          <p className="text-xs text-[#8C8C7A] px-4 leading-relaxed">
                            Controlla che il codice inserito sia esatto (es: TR-8291) o che l'indirizzo e-mail coincida con quello usato per registrare la richiesta.
                          </p>
                        </motion.div>
                      )
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ) : (
            
            /* --- BACKOFFICE ADMIN VIEW --- */
            <motion.div
              key="backoffice-flow"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              id="backoffice-portal"
              className="space-y-8"
            >
              {/* Backoffice Landing */}
              <div className="bg-white rounded-3xl p-6 border border-[#E5E5E0] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#5A5A40]" />
                    <h2 className="font-serif text-2xl italic text-[#4A4A3A] tracking-tight">
                      Back-Office Ristorante
                    </h2>
                  </div>
                  <p className="text-xs text-[#8C8C7A] font-sans mt-0.5 uppercase tracking-wider font-bold">
                    Pannello di controllo del gestore in tempo reale
                  </p>
                </div>

                {/* Secure Auth Toggle Trigger */}
                <div className="shrink-0">
                  <AnimatePresence mode="wait">
                    {!isCustomAdmin && !currentUser ? (
                      <motion.button
                        key="login-btn"
                        id="login-google-btn"
                        onClick={handleLogin}
                        className="px-5 py-2 w-full sm:w-auto bg-[#F0EFEC] hover:bg-[#E5E5E0] border border-[#E5E5E0] text-[#4A4A3A] text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition duration-300"
                      >
                        <LogIn className="w-3.5 h-3.5 text-[#5A5A40]" />
                        <span>Accedi con Google</span>
                      </motion.button>
                    ) : (
                      <motion.div
                        key="logout-btn"
                        className="flex flex-col sm:flex-row items-center gap-3"
                      >
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#1C1C1C]">{isCustomAdmin ? 'Gestore (Admin)' : (currentUser?.displayName || 'Gestore')}</p>
                          <p className="text-[10px] font-mono text-[#8C8C7A]">{isCustomAdmin ? 'admin@latrattoria-assisi.it' : (currentUser?.email || '')}</p>
                        </div>
                        <button
                          id="logout-btn"
                          onClick={handleLogout}
                          className="p-2 border border-[#E5E5E0] hover:bg-[#F0EFEC] text-[#8C8C7A] rounded-xl transition duration-300"
                          title="Disconnetti"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Secure Firewall block checks */}
              {!isCustomAdmin && !currentUser ? (
                /* Unauthenticated View card with Admin credentials form */
                <div id="unauthenticated-block" className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-[#E5E5E0] shadow-sm space-y-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-[#FAF9F6] text-[#5A5A40] rounded-full flex items-center justify-center mx-auto border border-[#E5E5E0]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg italic text-[#4A4A3A]">Accesso Gestore</h3>
                      <p className="text-xs text-[#8C8C7A] leading-relaxed">
                        Accedi con username e password amministratore per gestire le prenotazioni ed il menù.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAdminCredentialsLogin} className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label htmlFor="login-username" className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider">Nome Utente</label>
                      <input
                        id="login-username"
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Nome utente (es: admin)"
                        className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-semibold focus:border-[#5A5A40] outline-none transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="login-password" className="text-[10px] font-bold text-[#8C8C7A] uppercase tracking-wider">Password</label>
                      <input
                        id="login-password"
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Password (es: admin)"
                        className="w-full bg-[#FAF9F6] border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-semibold focus:border-[#5A5A40] outline-none transition"
                      />
                    </div>

                    <button
                      type="submit"
                      id="login-admin-btn"
                      className="w-full py-3.5 bg-[#5A5A40] hover:bg-[#4A4A32] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition duration-300 shadow-sm flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#DFCD9E]" />
                      <span>Accedi al Pannello</span>
                    </button>
                  </form>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[#E5E5E0]"></div>
                    <span className="flex-shrink mx-4 text-[9px] text-[#8C8C7A] uppercase font-bold tracking-wider">oppure</span>
                    <div className="flex-grow border-t border-[#E5E5E0]"></div>
                  </div>

                  <button
                    id="login-trigger-inside"
                    type="button"
                    onClick={handleLogin}
                    className="w-full py-3 border border-[#E5E5E0] hover:bg-[#FAF9F6] text-[#4A4A3A] font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition duration-300 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#5A5A40]" />
                    <span>Accedi temporaneamente con Google</span>
                  </button>

                  <div className="text-[10px] text-center text-[#8C8C7A] font-semibold pt-1 border-t border-dashed border-[#E5E5E0]">
                    Credenziali di prova: <strong className="text-[#1C1C1C] font-mono font-extrabold">admin / admin</strong>
                  </div>
                </div>
              ) : (
                /* Authenticated Content flow */
                <div id="admin-workspace" className="space-y-10">
                  
                  {/* --- SECTION 1: PRENOTAZIONI RICEVUTE --- */}
                  <div id="admin-bookings-subsystem" className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-serif text-xl italic text-[#4A4A3A] flex items-center gap-2">
                          <Clock className="w-4.5 h-4.5 text-[#5A5A40]" />
                          <span>Richieste di Prenotazione Tavoli ({activeBookingsList.length})</span>
                        </h3>
                        <p className="text-xs text-[#8C8C7A]">Controlla e approva lo stato di afflusso al locale in tempo reale</p>
                      </div>
                    </div>

                    {loadingBookings ? (
                      <div className="py-12 bg-white rounded-2xl border border-[#E5E5E0] text-center text-[#8C8C7A] text-xs">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin mx-auto mb-2"></div>
                        Caricamento richieste...
                      </div>
                    ) : activeBookingsList.length === 0 ? (
                      <div className="bg-white rounded-2xl p-10 text-center border border-[#E5E5E0] text-[#8C8C7A] text-xs space-y-2">
                        <Calendar className="w-8 h-8 mx-auto text-[#8C8C7A] opacity-60" />
                        <p>Nessuna prenotazione ricevuta al momento.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {activeBookingsList.map((booking) => (
                          <div
                            key={booking.id}
                            id={`admin-booking-card-${booking.id}`}
                            className="bg-white rounded-3xl p-5 border border-[#E5E5E0] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between gap-4"
                          >
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-extrabold text-[#5A5A40] bg-[#F0EFEC] border border-[#E5E5E0] px-2.5 py-0.5 rounded-full">
                                  {booking.id}
                                </span>
                                
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  booking.status === 'confirmed' 
                                    ? 'bg-green-50 text-green-700' 
                                    : booking.status === 'cancelled' 
                                    ? 'bg-red-50 text-red-700' 
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {booking.status === 'confirmed' ? 'Confermata' :
                                   booking.status === 'cancelled' ? 'Rifiutata' : 'In attesa'}
                                </span>

                                <span className="text-[10px] text-[#8C8C7A] font-medium ml-auto md:ml-0">
                                  {booking.createdAt instanceof Date ? booking.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Tempo reale"}
                                </span>
                              </div>

                              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <p className="text-[#8C8C7A] text-[9px] uppercase font-bold">Cliente</p>
                                  <p className="font-bold text-[#1C1C1C] truncate">{booking.customerName}</p>
                                </div>
                                <div className="text-xs">
                                  <p className="text-[#8C8C7A] text-[9px] uppercase font-bold">Contatti</p>
                                  <p className="text-[#1C1C1C] truncate">{booking.phone}</p>
                                  <p className="text-[#8C8C7A] text-[10px] truncate">{booking.email}</p>
                                </div>
                                <div>
                                  <p className="text-[#8C8C7A] text-[9px] uppercase font-bold">Data, Ora & Ospiti</p>
                                  <p className="font-semibold text-[#1C1C1C]">{booking.date} alle {booking.time}</p>
                                  <p className="text-[#8C8C7A] font-bold">{booking.guests} persone</p>
                                </div>
                              </div>

                              {booking.notes && (
                                <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E5E5E0] text-xs text-[#8C8C7A]">
                                  <span className="font-bold text-[#1C1C1C]">Note speciali:</span> "{booking.notes}"
                                </div>
                              )}
                            </div>

                            {/* Approval/Cancellation Quick Action Controls */}
                            <div className="flex md:flex-col justify-end gap-1.5 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-dashed border-[#E5E5E0]">
                              <button
                                disabled={booking.status === 'confirmed'}
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-100 disabled:text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl transition duration-300 flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approva</span>
                              </button>
                              <button
                                disabled={booking.status === 'cancelled'}
                                onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                className="flex-1 md:flex-none px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl transition duration-300 flex items-center justify-center gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rifiuta</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* --- SECTION 2: GESTIONE PIATTI MENÙ --- */}
                  <div id="admin-menu-subsystem" className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-serif text-xl italic text-[#4A4A3A] flex items-center gap-2">
                          <ChefHat className="w-4.5 h-4.5 text-[#5A5A40]" />
                          <span>Piattaforma Menù Digitale</span>
                        </h3>
                        <p className="text-xs text-[#8C8C7A]">Aggiungi o imposta come esaurito un piatto in tempo reale per tutti i clienti</p>
                      </div>
 
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            if ((menuItems.length > 0 ? menuItems : simulatedMenuItems).length === 0) {
                              handleSeedMenu();
                            } else {
                              triggerNotification("Il menù possiede già piantone. Inizializzo comunque per aggiungerne di nuovi.", "info");
                              handleSeedMenu();
                            }
                          }}
                          className="flex-1 sm:flex-initial px-4 py-2 border border-[#E5E5E0] hover:bg-[#F0EFEC] text-[#8C8C7A] text-xs font-bold uppercase tracking-wider rounded-xl transition duration-300 flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Ripristina Piatti</span>
                        </button>
                        <button
                          onClick={() => setIsAddingDish(!isAddingDish)}
                          className="flex-1 sm:flex-initial px-4 py-2 bg-[#5A5A40] hover:bg-[#4A4A32] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition duration-300 flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nuovo Piatto</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Add Dish Form */}
                    <AnimatePresence>
                      {isAddingDish && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleAddDishSubmit}
                          id="add-dish-form"
                          className="bg-[#FAF9F6] rounded-3xl p-6 border border-[#E5E5E0] shadow-sm space-y-4 overflow-hidden"
                        >
                          <h4 className="font-serif text-sm italic text-[#4A4A3A]">Aggiungi un Nuovo Piatto nel Menù</h4>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#8C8C7A] uppercase">Nome Piatto</label>
                              <input
                                type="text"
                                required
                                value={dishForm.name}
                                onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                                placeholder="es. Carbonara Speciale"
                                className="w-full bg-white border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-medium focus:border-[#5A5A40] outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#8C8C7A] uppercase">Prezzo (€)</label>
                              <input
                                type="number"
                                step="0.50"
                                required
                                value={dishForm.price}
                                onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                                placeholder="es: 15.00"
                                className="w-full bg-white border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-medium focus:border-[#5A5A40] outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#8C8C7A] uppercase">Portata / Categoria</label>
                              <select
                                value={dishForm.category}
                                onChange={(e) => setDishForm({ ...dishForm, category: e.target.value as MenuCategory })}
                                className="w-full bg-white border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-medium focus:border-[#5A5A40] outline-none"
                              >
                                <option value="antipasti">Antipasti</option>
                                <option value="primi">Primi Piatti</option>
                                <option value="secondi">Secondi Piatti</option>
                                <option value="dolci">Dolci & Dessert</option>
                                <option value="bevande">Bevande</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#8C8C7A] uppercase">Descrizione Ingredienti</label>
                            <input
                              type="text"
                              value={dishForm.description}
                              onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                              placeholder="Fettuccine all'uovo fresche con sugo di cinghiale e scaglie di pecorino appassito..."
                              className="w-full bg-white border border-[#E5E5E0] rounded-xl px-3 py-2 text-xs font-medium focus:border-[#5A5A40] outline-none"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <label className="flex items-center gap-2 text-xs text-[#8C8C7A] font-bold uppercase tracking-wider">
                              <input
                                type="checkbox"
                                checked={dishForm.available}
                                onChange={(e) => setDishForm({ ...dishForm, available: e.target.checked })}
                                className="rounded text-[#5A5A40] focus:ring-[#5A5A40] w-4 h-4"
                              />
                              In vendita da subito
                            </label>

                            <div className="flex gap-2 text-xs uppercase tracking-wider font-bold">
                              <button
                                type="button"
                                onClick={() => setIsAddingDish(false)}
                                className="px-4 py-2 border border-[#E5E5E0] hover:bg-[#F0EFEC] rounded-xl text-[#8C8C7A]"
                              >
                                Annulla
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-[#5A5A40] hover:bg-[#4A4A32] text-white rounded-xl"
                              >
                                Salva piatto
                              </button>
                            </div>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* Admin list view of menu items */}
                    <div className="bg-white rounded-3xl border border-[#E5E5E0] shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#FAF9F6] border-b border-[#E5E5E0] text-[10px] text-[#8C8C7A] font-bold uppercase tracking-wider">
                              <th className="p-4">Piatto</th>
                              <th className="p-4">Categoria</th>
                              <th className="p-4">Prezzo</th>
                              <th className="p-4 text-center">Stato Disponibilità</th>
                              <th className="p-4 text-right">Rimuovi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E5E0]">
                            {(menuItems.length > 0 ? menuItems : simulatedMenuItems).map((dish) => (
                              <tr key={dish.id} id={`admin-dish-${dish.id}`} className="hover:bg-[#FAF9F6] transition">
                                <td className="p-4">
                                  <div className="font-serif italic text-sm text-[#1C1C1C]">{dish.name}</div>
                                  <div className="text-[#8C8C7A] text-xs mt-0.5 line-clamp-1 max-w-sm">{dish.description}</div>
                                </td>
                                <td className="p-4 font-mono text-[#8C8C7A] uppercase font-bold text-[10px]">{dish.category}</td>
                                <td className="p-4 font-mono font-bold text-[#1C1C1C]">€ {dish.price.toFixed(2)}</td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center">
                                    <button
                                      onClick={() => handleToggleAvailability(dish.id, dish.available)}
                                      className={`px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-1 border ${
                                        dish.available 
                                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/50' 
                                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50'
                                      }`}
                                    >
                                      {dish.available ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>Disponibile</span>
                                        </>
                                      ) : (
                                        <>
                                          <X className="w-3 h-3" />
                                          <span>Esaurito</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteMenuItem(dish.id)}
                                    className="p-1.5 hover:bg-red-50 text-[#8C8C7A] hover:text-red-500 rounded-xl transition duration-300"
                                    title="Cancella piatto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. Footer and Credentials matching elegant Bento Theme */}
      <footer id="footer" className="border-t border-[#E5E5E0] bg-white text-[#8C8C7A] text-xs py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h4 className="font-serif italic text-[#4A4A3A] text-base font-semibold">La cucina di Elvira</h4>
            <p className="leading-relaxed font-light text-[#8C8C7A]">
              Scopri il piacere dell'autentica tradizione casereccia, unendo la freschezza degli ingredienti alla passione per le cose preparate con cura ed amore.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-serif italic text-[#4A4A3A] text-base font-semibold">Orari di Apertura</h4>
            <p className="font-light">Pranzo: <strong className="text-[#1C1C1C]">12:00 - 15:30</strong></p>
            <p className="font-light">Cena: <strong className="text-[#1C1C1C]">19:00 - 23:30</strong></p>
            <p className="text-[#5A5A40] text-[9px] uppercase tracking-wider font-extrabold mt-1.5">Aperti tutti i giorni per pranzo e cena</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-serif italic text-[#4A4A3A] text-base font-semibold">Contatti</h4>
            <p className="font-light flex items-center gap-1">📞 Telefono: <strong className="text-[#1C1C1C] font-mono">338 933 8810</strong></p>
            <p className="font-light">📧 Email: <strong className="text-[#1C1C1C]">info@lacucinadielvira.it</strong></p>
            <p className="font-light text-[#8C8C7A] flex items-center gap-1">🌐 Wi-Fi: <span className="text-[#1C1C1C] font-mono">Elvira29</span></p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-[#E5E5E0] flex flex-col sm:flex-row justify-between text-[#8C8C7A] text-[9px] font-mono uppercase tracking-wider font-bold">
          <p>© {new Date().getFullYear()} La cucina di Elvira. Tutti i diritti riservati.</p>
          <p>Real-time database sync active</p>
        </div>
      </footer>
    </div>
  );
}
