import React, { useState, useEffect } from 'react';
import { 
  Tractor, 
  Droplet, 
  Wind, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  Star,
  Package,
  Calendar as CalendarIcon,
  CheckCircle,
  Search,
  LogOut,
  Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType, 
  testFirestoreConnection 
} from './services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

// Models matching Kotlin Equipment.kt
interface Equipment {
  id: string;
  name: string;
  type: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone?: string;
  ownerAddress?: string;
  hourlyRate: number;
  dailyRate: number;
  healthCondition: string;
  lastWork?: string;
  isAvailable: boolean;
  distanceKm: number;
  imageUrl: string;
  details?: string;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span>
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export default function App() {
  const [screen, setScreen] = useState<'splash' | 'auth' | 'dashboard' | 'booking' | 'status' | 'addMachine' | 'manageRequests' | 'myBookings'>('splash');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userRole, setUserRole] = useState<'FARMER' | 'OWNER'>('FARMER');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [duration, setDuration] = useState(4);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [bookingDate, setBookingDate] = useState('2026-05-15');
  
  // Shared global state from Firestore
  const [allMachines, setAllMachines] = useState<Equipment[]>([]);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [editingHealthId, setEditingHealthId] = useState<string | null>(null);
  const [tempHealth, setTempHealth] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Farmer's bookings
  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Owner's received requests
  const [ownerRequests, setOwnerRequests] = useState<any[]>([]);

  const [machineReviews, setMachineReviews] = useState<any[]>([]);

  useEffect(() => {
    testFirestoreConnection();
    
    // Listen for Auth changes
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setLoggedInUser({ ...userData, uid: firebaseUser.uid });
            setUserRole(userData.role);
            setScreen('dashboard');
          } else {
            // Profile not yet created
            setLoggedInUser(null);
            setScreen('auth');
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setLoggedInUser(null);
        setScreen('auth');
      }
    });

    // Listen for Machines
    const unsubMachines = onSnapshot(collection(db, 'machines'), (snapshot) => {
      const machines: Equipment[] = [];
      snapshot.forEach(doc => {
        machines.push({ id: doc.id, ...doc.data() } as Equipment);
      });
      setAllMachines(machines);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'machines'));

    // Listen for Reviews
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const reviews: any[] = [];
      snapshot.forEach(doc => {
        reviews.push({ id: doc.id, ...doc.data() });
      });
      setMachineReviews(reviews);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reviews'));

    return () => {
      unsubAuth();
      unsubMachines();
      unsubReviews();
    };
  }, []);

  // Separate effect for bookings based on logged in user
  useEffect(() => {
    if (!loggedInUser) return;

    let unsubMyBookings = () => {};
    let unsubOwnerRequests = () => {};

    if (loggedInUser.role === 'FARMER') {
      const q = query(collection(db, 'bookings'), where('farmerUid', '==', loggedInUser.uid));
      unsubMyBookings = onSnapshot(q, (snapshot) => {
        const bookings: any[] = [];
        snapshot.forEach(doc => {
          bookings.push({ id: doc.id, ...doc.data() });
        });
        setMyBookings(bookings);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'bookings'));
    } else {
      const q = query(collection(db, 'bookings'), where('ownerUid', '==', loggedInUser.uid));
      unsubOwnerRequests = onSnapshot(q, (snapshot) => {
        const requests: any[] = [];
        snapshot.forEach(doc => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        setOwnerRequests(requests);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'bookings'));
    }

    return () => {
      unsubMyBookings();
      unsubOwnerRequests();
    };
  }, [loggedInUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLoggedInUser(null);
      setScreen('auth');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const handleAuth = async () => {
    if (authMode === 'register') {
      if (!userName || !userPhone || !userEmail || !userPassword) {
        alert("Please fill all fields");
        return;
      }
      try {
        const userCred = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
        const newUser = { 
          uid: userCred.user.uid,
          name: userName, 
          phone: userPhone, 
          address: userAddress, 
          role: userRole,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', userCred.user.uid), newUser);
        setLoggedInUser(newUser);
        setScreen('dashboard');
      } catch (error: any) {
        alert(error.message);
      }
    } else {
      if (!userEmail || !userPassword) {
        alert("Please enter email and password");
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, userEmail, userPassword);
      } catch (error: any) {
        alert("Login failed: " + error.message);
      }
    }
  };

  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => setScreen('auth'), 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const navigateToBooking = (item: Equipment) => {
    // Only block if the user is an owner AND it's their own machine
    if (userRole === 'OWNER' && item.ownerUid === loggedInUser?.uid) return;
    if (userRole !== 'FARMER') return; // Only farmers can book
    
    setSelectedItem(item);
    setScreen('booking');
  };

  const handleBookingSubmit = async () => {
    if (selectedItem && loggedInUser) {
      try {
        const b = {
          machineId: selectedItem.id,
          machineName: selectedItem.name,
          ownerUid: selectedItem.ownerUid,
          ownerName: selectedItem.ownerName,
          ownerPhone: selectedItem.ownerPhone || "98765 43210",
          ownerAddress: selectedItem.ownerAddress || "Village Center",
          farmerUid: loggedInUser.uid,
          farmerName: loggedInUser.name,
          farmerPhone: loggedInUser.phone,
          farmerAddress: loggedInUser.address,
          date: bookingDate,
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          amount: duration * selectedItem.hourlyRate,
          status: 'PENDING',
          paymentMethod: null,
          farmerConfirmed: false,
          ownerFinalized: false,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'bookings'), b);
        setScreen('status');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'bookings');
      }
    }
  };

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRate || !loggedInUser) return;
    
    try {
      const machine = {
        name: newName,
        type: "Machine",
        ownerUid: loggedInUser.uid,
        ownerName: loggedInUser.name,
        ownerPhone: loggedInUser.phone,
        ownerAddress: loggedInUser.address,
        hourlyRate: parseInt(newRate),
        dailyRate: parseInt(newRate) * 8,
        healthCondition: "Excellent",
        isAvailable: true,
        distanceKm: 0,
        imageUrl: "",
        details: newDetails,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'machines'), machine);
      setNewName('');
      setNewRate('');
      setNewDetails('');
      setScreen('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'machines');
    }
  };

  const handleUpdateHealth = async (id: string, health: string) => {
    try {
      await updateDoc(doc(db, 'machines', id), { healthCondition: health });
      setEditingHealthId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `machines/${id}`);
    }
  };

  const handleRequestAction = async (id: string, action: 'ACCEPTED' | 'DECLINED') => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status: action });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const handleFarmerConfirm = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { farmerConfirmed: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const handlePayment = async (bookingId: string, method: 'Online' | 'After Work') => {
    if (method === 'Online') {
      const upiApps = ['PhonePe', 'Paytm', 'Google Pay'];
      const app = upiApps[Math.floor(Math.random() * upiApps.length)];
      alert(`Simulating redirection to ${app}...`);
      setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'bookings', bookingId), { 
            paymentMethod: method, 
            paidOnline: true 
          });
          alert("Payment Successful!");
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
        }
      }, 2000);
    } else {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { paymentMethod: method });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
      }
    }
  };

  const handleMarkDone = async (id: string) => {
    const booking = myBookings.find(b => b.id === id) || ownerRequests.find(r => r.id === id);
    if (booking) {
      try {
        const now = new Date();
        const workInfo = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        await updateDoc(doc(db, 'machines', booking.machineId), { lastWork: workInfo });
        await updateDoc(doc(db, 'bookings', id), { isCompleted: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `multiple-collections/${id}`);
      }
    }
  };

  const handleSubmitReview = async (bookingId: string, rating: number, comment: string) => {
    const booking = myBookings.find(b => b.id === bookingId);
    if (booking && loggedInUser) {
      try {
        const newReview = {
          machineId: booking.machineId,
          machineName: booking.machineName,
          farmerName: loggedInUser.name,
          rating,
          comment,
          date: new Date().toLocaleDateString(),
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'reviews'), newReview);
        alert("Review submitted! Thank you.");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'reviews');
      }
    }
  };

  const handleConfirmRent = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', requestId), { ownerFinalized: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${requestId}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans p-4">
      <div className="relative w-full max-w-[375px] h-[700px] bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-800 overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="h-6 bg-agri-green flex items-center justify-between px-6 text-[10px] text-white shrink-0">
          <LiveClock />
          <div className="flex gap-1">
            <div className="w-3 h-2 bg-white rounded-sm opacity-50" />
            <div className="w-3 h-2 bg-white rounded-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
          <AnimatePresence mode="wait">
            {screen === 'splash' && (
              <motion.div 
                key="splash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 bg-agri-green flex flex-col items-center justify-center text-white"
              >
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Tractor size={64} />
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter">NAMMA YANTRA SHARE</h1>
                <p className="mt-2 text-white/70 font-medium">BHOOMIYE NAMMA BALA</p>
                <div className="absolute bottom-12 flex flex-col items-center">
                   <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: -32 }}
                        animate={{ x: 32 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-full h-full bg-white"
                      />
                   </div>
                   <span className="text-[10px] mt-2 opacity-50 uppercase tracking-widest">Loading Village Network</span>
                </div>
              </motion.div>
            )}

            {screen === 'auth' && (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 p-8 flex flex-col"
              >
                <div className="text-agri-green mb-8">
                  <Tractor size={48} />
                  <h2 className="text-2xl font-black mt-2">Namma Yantra Share</h2>
                  <p className="text-gray-500 text-sm">Empowering every farmer</p>
                </div>

                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${authMode === 'login' ? 'border-agri-green text-agri-green' : 'border-transparent text-gray-400'}`}
                  >
                    LOGIN
                  </button>
                  <button 
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${authMode === 'register' ? 'border-agri-green text-agri-green' : 'border-transparent text-gray-400'}`}
                  >
                    REGISTER
                  </button>
                </div>

                <div className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white" 
                      />
                      <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white" 
                      />
                      <input 
                        type="password" 
                        placeholder="Password" 
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white" 
                      />
                      <input 
                        type="tel" 
                        placeholder="Phone Number" 
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white" 
                      />
                      <input 
                        type="text" 
                        placeholder="Village Address" 
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white" 
                      />
                      
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        <button 
                          onClick={() => setUserRole('FARMER')}
                          className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all ${userRole === 'FARMER' ? 'bg-white text-agri-green shadow-sm' : 'text-gray-400'}`}
                        >
                          I AM A FARMER
                        </button>
                        <button 
                          onClick={() => setUserRole('OWNER')}
                          className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all ${userRole === 'OWNER' ? 'bg-white text-agri-green shadow-sm' : 'text-gray-400'}`}
                        >
                          I AM AN OWNER
                        </button>
                      </div>
                    </>
                  )}
                  {authMode === 'login' && (
                    <>
                      <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white" 
                      />
                      <input 
                        type="password" 
                        placeholder="Password" 
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white" 
                      />
                    </>
                  )}
                </div>

                <button 
                  onClick={handleAuth}
                  className="w-full h-12 bg-agri-green text-white font-bold rounded-xl mt-8 shadow-lg shadow-green-200 active:scale-95 transition-transform"
                >
                  {authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </button>
              </motion.div>
            )}

            {screen === 'dashboard' && (
              <Dashboard 
                key="dash" 
                data={allMachines} 
                userRole={userRole}
                userName={userName}
                loggedInUser={loggedInUser}
                machineReviews={machineReviews}
                editingHealthId={editingHealthId}
                setEditingHealthId={setEditingHealthId}
                tempHealth={tempHealth}
                setTempHealth={setTempHealth}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onUpdateHealth={handleUpdateHealth}
                onSelect={navigateToBooking} 
                onAdd={() => setScreen('addMachine')}
                onManage={() => setScreen('manageRequests')}
                onLogout={handleLogout}
              />
            )}

            {screen === 'addMachine' && (
              <motion.div 
                key="add"
                initial={{ y: 700 }}
                animate={{ y: 0 }}
                className="flex-1 bg-white p-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setScreen('dashboard')}><ChevronLeft className="text-agri-green" /></button>
                  <h2 className="text-xl font-bold">List Your Machine</h2>
                </div>
                <form onSubmit={handleAddMachine} className="space-y-4">
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 aspect-video">
                    <Droplet size={32} />
                    <span className="text-xs mt-2">Upload Photo</span>
                  </div>
                  <input 
                    placeholder="Machine Name (e.g. Swaraj 744)" 
                    className="w-full h-12 px-4 bg-gray-50 rounded-xl"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <textarea 
                    placeholder="Machine Details (e.g. 50HP, Power Steering)" 
                    className="w-full p-4 bg-gray-50 rounded-xl min-h-[100px] text-sm"
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                  />
                  <input 
                    placeholder="Hourly Rate (₹)" 
                    type="number" 
                    className="w-full h-12 px-4 bg-gray-50 rounded-xl"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                  />
                  <button type="submit" className="w-full h-14 bg-agri-green text-white font-bold rounded-xl shadow-lg">Save Machine</button>
                </form>
              </motion.div>
            )}

            {screen === 'myBookings' && (
              <motion.div 
                key="myBookings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 bg-white p-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setScreen('dashboard')}><ChevronLeft className="text-agri-green" /></button>
                  <h2 className="text-xl font-bold">My Bookings</h2>
                </div>
                <div className="space-y-4">
                  {myBookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <CalendarIcon size={48} className="mx-auto opacity-20 mb-4" />
                      <p>No bookings yet</p>
                    </div>
                  ) : (
                    myBookings.map(b => (
                      <div key={b.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-800">{b.machineName}</h3>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                             b.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                          }`}>{b.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Owner: {b.owner} ({b.ownerPhone})</p>
                        <p className="text-[10px] text-gray-400">Address: {b.ownerAddress}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{b.date} • {b.startTime} to {b.endTime} ({b.duration} hrs)</p>
                        
                        {b.status === 'ACCEPTED' && !b.ownerFinalized && (
                          <div className="mt-4 p-3 bg-white rounded-xl border border-green-100 space-y-3">
                            <div className="flex gap-2">
                               <a href={`tel:${b.ownerPhone}`} className="flex-1 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
                                 <Droplet size={10} /> Call {b.owner}
                               </a>
                            </div>
                            
                            {!b.farmerConfirmed ? (
                              <button 
                                onClick={() => handleFarmerConfirm(b.id)}
                                className="w-full py-2 bg-agri-green text-white text-[10px] font-bold rounded-lg shadow-sm"
                              >
                                CONFIRM BOOKING & PROCEED
                              </button>
                            ) : !b.paymentMethod ? (
                              <div className="flex flex-col gap-2">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Select Payment</p>
                                <div className="flex gap-2">
                                  <button onClick={() => handlePayment(b.id, 'Online')} className="flex-1 py-2 bg-agri-green text-white text-[10px] font-bold rounded-lg transition-colors active:bg-green-700">Pay Online</button>
                                  <button onClick={() => handlePayment(b.id, 'After Work')} className="flex-1 py-2 border-2 border-agri-green text-agri-green text-[10px] font-bold rounded-lg active:bg-green-50">Pay After Work</button>
                                </div>
                              </div>
                            ) : (
                              <div className="py-2 px-3 bg-green-50 rounded-lg flex flex-col items-center justify-center gap-1 border border-green-100 text-center">
                                <div className="flex items-center gap-2">
                                  <CheckCircle size={12} className="text-agri-green" />
                                  <span className="text-[10px] text-agri-green font-black uppercase tracking-wider">Payment Set: {b.paymentMethod}</span>
                                </div>
                                <p className="text-[9px] text-agri-green/60">Waiting for Owner's Final Confirmation</p>
                              </div>
                            )}
                          </div>
                        )}

                        {b.ownerFinalized && !b.isCompleted && (
                          <div className="mt-4 p-3 bg-agri-green/5 rounded-xl border border-agri-green/20 space-y-2">
                             <div className="flex items-center gap-2 text-agri-green">
                               <CheckCircle size={14} />
                               <span className="text-xs font-bold">BOOKING SUCCESSFUL</span>
                             </div>
                             <div className="p-2 bg-white rounded-lg border border-agri-green/10 text-[10px]">
                                <p className="text-gray-500">Contact Owner to start work:</p>
                                <p className="font-bold text-gray-800">{b.owner}: {b.ownerPhone}</p>
                             </div>
                             <button 
                               onClick={() => handleMarkDone(b.id)}
                               className="w-full py-2 bg-agri-earth text-white text-[10px] font-bold rounded-lg mt-2"
                             >
                               MARK WORK AS DONE
                             </button>
                          </div>
                        )}

                        {b.isCompleted && !b.review && (
                          <ReviewForm 
                            onReview={(rating, comment) => handleSubmitReview(b.id, rating, comment)} 
                          />
                        )}

                        {b.review && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 italic">
                             <div className="flex items-center gap-1 text-yellow-500 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={10} fill={i < b.review.rating ? "currentColor" : "none"} />
                                ))}
                             </div>
                             <p className="text-[10px] text-gray-600">"{b.review.comment}"</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs font-medium text-gray-400">{b.duration} hrs</span>
                          <span className="text-sm font-bold text-agri-green">₹{b.amount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {screen === 'manageRequests' && (
              <motion.div 
                key="manage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 p-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setScreen('dashboard')}><ChevronLeft className="text-agri-green" /></button>
                  <h2 className="text-xl font-bold">Rental Offers</h2>
                </div>
                <div className="space-y-4">
                  {ownerRequests
                    .filter(req => req.owner === loggedInUser?.name)
                    .length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Package size={48} className="mx-auto opacity-20 mb-4" />
                        <p>No requests for your machines</p>
                      </div>
                    ) : (
                      ownerRequests
                        .filter(req => req.owner === loggedInUser?.name)
                        .map(req => (
                          <div key={req.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-800">{req.farmerName} ({req.farmerPhone})</h4>
                                <p className="text-[10px] text-gray-400 italic">Address: {req.farmerAddress}</p>
                                <p className="text-xs text-gray-500 uppercase font-medium mt-1">{req.machineName} • {req.duration} hrs</p>
                                <p className="text-[9px] text-gray-400 italic">{req.date}, {req.startTime} - {req.endTime}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                req.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 
                                req.status === 'DECLINED' ? 'bg-red-100 text-red-700' : 
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                            
                            {req.status === 'PENDING' && (
                              <div className="flex gap-2 mt-4">
                                <button 
                                  onClick={() => handleRequestAction(req.id, 'ACCEPTED')}
                                  className="flex-1 py-2 bg-agri-green text-white text-xs font-bold rounded-xl"
                                >
                                  ACCEPT
                                </button>
                                <button 
                                  onClick={() => handleRequestAction(req.id, 'DECLINED')}
                                  className="flex-1 py-2 bg-red-100 text-red-600 text-xs font-bold rounded-xl"
                                >
                                  REJECT
                                </button>
                              </div>
                            )}

                            {req.status === 'ACCEPTED' && (
                              <div className="mt-4 flex flex-col gap-3">
                                 <div className="flex gap-2">
                                   <a href={`tel:${req.farmerPhone}`} className="flex-1 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
                                     Call Farmer
                                   </a>
                                 </div>
                                 
                                 {req.farmerConfirmed ? (
                                   <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col gap-1">
                                      <div className="flex items-center gap-2 text-blue-600">
                                        <CheckCircle size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Farmer Confirmed Booking</span>
                                      </div>
                                      {req.paymentMethod && (
                                         <p className="text-[9px] text-blue-500 font-medium italic">Payment Preference: {req.paymentMethod}</p>
                                      )}
                                   </div>
                                 ) : (
                                   <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                     <p className="text-[10px] text-orange-600 font-bold">Waiting for Farmer Confirmation...</p>
                                   </div>
                                 )}

                                 {req.farmerConfirmed && req.paymentMethod && (
                                   <>
                                     {!req.ownerFinalized ? (
                                       <button 
                                         onClick={() => handleConfirmRent(req.id)}
                                         className="w-full py-2.5 bg-agri-earth text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                                       >
                                         <CheckCircle size={14} /> FINALIZE & START RENT
                                       </button>
                                     ) : !req.isCompleted ? (
                                       <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-2">
                                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">In Progress / Finalized</p>
                                         <button 
                                           onClick={() => handleMarkDone(req.id)}
                                           className="w-full py-1.5 bg-agri-earth text-white text-[10px] font-bold rounded-lg"
                                         >
                                           COMPLETE WORK
                                         </button>
                                       </div>
                                     ) : (
                                       <div className="p-3 bg-agri-green text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm">
                                         <CheckCircle size={14} /> WORK COMPLETED
                                       </div>
                                     )}
                                   </>
                                 )}
                              </div>
                            )}
                          </div>
                        ))
                    )}
                </div>
              </motion.div>
            )}

            {screen === 'booking' && selectedItem && (
              <Booking 
                key="book" 
                item={selectedItem} 
                duration={duration}
                setDuration={setDuration}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                onBack={() => setScreen('dashboard')}
                onSubmit={handleBookingSubmit}
              />
            )}
            {screen === 'status' && (
              <Status 
                key="status" 
                owner={selectedItem?.ownerName || ""} 
                onBack={() => setScreen('dashboard')} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* Improved Dashboard Bottom Bar */}
        {(screen === 'dashboard' || screen === 'myBookings' || screen === 'manageRequests') && (
          <div className="h-20 bg-white border-t px-4 flex items-center justify-between shrink-0">
             <button 
              onClick={() => setScreen('dashboard')}
              className={`flex flex-col items-center flex-1 ${screen === 'dashboard' ? 'text-agri-green' : 'text-gray-300'}`}
             >
               <Search size={20} />
               <span className="text-[10px] mt-1 font-bold">Browse</span>
             </button>
             
             {userRole === 'FARMER' && (
               <button 
                 onClick={() => setScreen('myBookings')}
                 className={`flex flex-col items-center flex-1 ${screen === 'myBookings' ? 'text-agri-green' : 'text-gray-300'}`}
               >
                 <CalendarIcon size={20} />
                 <span className="text-[10px] mt-1 font-bold">Bookings</span>
               </button>
             )}

             {userRole === 'OWNER' && (
               <>
                <button 
                  onClick={() => setScreen('addMachine')}
                  className="w-12 h-12 bg-agri-green text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white mx-2"
                >
                  <Droplet size={24} />
                </button>

                <button 
                  onClick={() => setScreen('manageRequests')}
                  className={`flex flex-col items-center flex-1 ${screen === 'manageRequests' ? 'text-agri-green' : 'text-gray-300'}`}
                >
                  <Package size={20} />
                  <span className="text-[10px] mt-1 font-bold">Offers</span>
                </button>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ data, userRole, userName, loggedInUser, machineReviews, editingHealthId, setEditingHealthId, tempHealth, setTempHealth, searchQuery, setSearchQuery, onUpdateHealth, onSelect, onAdd, onManage, onLogout }: { 
  data: Equipment[], 
  userRole: string, 
  userName: string, 
  loggedInUser: any, 
  machineReviews: any[], 
  editingHealthId: string | null,
  setEditingHealthId: (id: string | null) => void,
  tempHealth: string,
  setTempHealth: (h: string) => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  onUpdateHealth: (id: string, health: string) => void,
  onSelect: (item: Equipment) => void, 
  onAdd: () => void, 
  onManage: () => void, 
  onLogout: () => void 
}) {
  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="bg-agri-green p-6 pb-2 rounded-b-[32px] text-white shadow-lg shrink-0">
        <div className="flex justify-between items-start">
           <div>
             <h1 className="text-xl font-bold italic tracking-tight">NAMMA YANTRA SHARE</h1>
             <p className="text-[10px] opacity-70 font-black tracking-widest mt-1">Village Network</p>
           </div>
           <div className="flex gap-2">
             <button 
              onClick={onLogout}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center"
             >
               <LogOut size={18} />
             </button>
             <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
               <Tractor size={20} />
             </div>
           </div>
        </div>

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={14} />
          <input 
            type="text"
            placeholder="Search machine name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 mt-4 pb-20">
        {machineReviews.length > 0 && (
          <div className="mb-6">
            <h2 className="text-agri-earth font-bold text-xs tracking-wide uppercase mb-3">Recent Reviews</h2>
            <div className="space-y-3">
              {machineReviews.map(rev => (
                <div key={rev.id} className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-800">{rev.farmerName}</span>
                    <span className="text-[9px] text-gray-400">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={8} fill={i < rev.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-600 line-clamp-2">"{rev.comment}"</p>
                  <p className="text-[8px] text-agri-green font-bold mt-1 uppercase italic">{rev.machineName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-agri-earth font-bold text-sm tracking-wide uppercase">Machinery Nearby</h2>
        </div>
        
        <div className="flex flex-col gap-4">
          {filteredData.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelect(item)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 active:scale-95 transition-transform"
            >
              <div className="w-20 h-20 bg-green-50 rounded-xl flex items-center justify-center text-agri-green">
                {item.type === 'Tractor' && <Tractor size={32} />}
                {item.type === 'Harvester' && <Wind size={32} />}
                {item.type === 'Sprayer' && <Droplet size={32} />}
                {item.ownerUid === loggedInUser?.uid && (
                   <div className="absolute top-0 right-0 bg-agri-earth text-white text-[8px] font-bold px-1.5 rounded-bl-lg">MY UNIT</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.isAvailable ? 'AVAILABLE' : 'BUSY'}
                  </span>
                </div>
                {item.details && <p className="text-[9px] text-gray-400 italic line-clamp-1 mt-0.5">{item.details}</p>}
                <p className="text-[8px] text-agri-earth font-bold mt-0.5 uppercase tracking-tighter">Health: {item.healthCondition}</p>
                {item.lastWork && <p className="text-[8px] text-blue-600 font-bold mt-0.5 uppercase tracking-tighter italic">Last Work: {item.lastWork}</p>}
                <div className="mt-0.5">
                  <p className="text-[10px] text-gray-400 font-bold">OWNER: {(item.ownerUid === loggedInUser?.uid) && userRole === 'OWNER' ? 'YOU' : item.ownerName}</p>
                  {item.ownerPhone && <p className="text-[9px] text-gray-400 flex items-center gap-1"><Clock size={8} /> {item.ownerPhone}</p>}
                  {item.ownerAddress && <p className="text-[9px] text-gray-400 flex items-center gap-1"><MapPin size={8} /> {item.ownerAddress}</p>}
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div className="text-agri-green font-black text-lg">
                    ₹{item.hourlyRate} <span className="text-[10px] text-gray-400 font-normal">/ hr</span>
                  </div>
                  <div className="flex items-center gap-1 text-agri-earth">
                     {(userRole === 'OWNER' && item.ownerUid === loggedInUser?.uid) ? (
                       <div className="flex flex-col gap-1 w-full">
                         {editingHealthId === item.id ? (
                           <div className="flex flex-col gap-1">
                             <input 
                               value={tempHealth}
                               onChange={(e) => setTempHealth(e.target.value)}
                               placeholder="Health Status"
                               className="text-[9px] p-1 border rounded"
                             />
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 onUpdateHealth(item.id, tempHealth);
                               }}
                               className="text-[8px] bg-agri-green text-white font-bold py-1 rounded"
                             >
                               SAVE
                             </button>
                           </div>
                         ) : (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingHealthId(item.id);
                               setTempHealth(item.healthCondition);
                             }}
                             className="text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-agri-earth text-agri-earth hover:bg-earth-50"
                           >
                             UPDATE HEALTH
                           </button>
                         )}
                       </div>
                     ) : (
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item);
                        }}
                        disabled={userRole !== 'FARMER'}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-2 ${userRole !== 'FARMER' ? 'opacity-30 cursor-not-allowed border-gray-200 text-gray-400' : 'border-agri-green text-agri-green hover:bg-green-50'}`}>
                          {userRole === 'OWNER' ? 'OWNER VIEW' : 'RENT NOW'}
                       </button>
                     )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Booking({ item, duration, setDuration, startTime, setStartTime, endTime, setEndTime, onBack, onSubmit }: { 
  item: Equipment, 
  duration: number, 
  setDuration: (d: number) => void,
  startTime: string,
  setStartTime: (s: string) => void,
  endTime: string,
  setEndTime: (e: string) => void,
  onBack: () => void,
  onSubmit: () => void
}) {
  const calculateDuration = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const total1 = h1 * 60 + m1;
    const total2 = h2 * 60 + m2;
    if (total2 <= total1) return 1;
    return Math.ceil((total2 - total1) / 60);
  };

  useEffect(() => {
    const d = calculateDuration(startTime, endTime);
    setDuration(d);
  }, [startTime, endTime]);

  const totalPrice = item.hourlyRate * duration;

  return (
    <motion.div 
      initial={{ x: 375 }}
      animate={{ x: 0 }}
      exit={{ x: 375 }}
      className="flex flex-col h-full bg-white relative z-10"
    >
      <div className="p-4 flex items-center gap-4 border-b">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="text-agri-green" />
        </button>
        <h2 className="font-bold text-lg">Rental Request</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-green-50 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-agri-green shadow-sm">
                {item.type === 'Tractor' && <Tractor size={24} />}
                {item.type === 'Harvester' && <Wind size={24} />}
                {item.type === 'Sprayer' && <Droplet size={24} />}
              </div>
              <div>
                <h3 className="font-bold text-agri-green">{item.name}</h3>
                <p className="text-xs text-gray-600 font-bold">Owner: {item.ownerName}</p>
                {item.ownerPhone && <p className="text-[10px] text-gray-500 italic">Phone: {item.ownerPhone}</p>}
                {item.ownerAddress && <p className="text-[10px] text-gray-500 italic">Address: {item.ownerAddress}</p>}
              </div>
            </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Hammer size={16} className="text-agri-earth" />
            <h4 className="text-sm font-bold text-agri-earth uppercase tracking-wider">Health Status</h4>
          </div>
          <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
            Condition: <span className="font-bold text-gray-800">{item.healthCondition}</span><br />
            {item.lastWork && <>Last Work: <span className="font-bold text-gray-800">{item.lastWork}</span></>}
          </p>
        </div>

        <div className="mt-8">
          <h4 className="text-sm font-bold text-agri-earth uppercase tracking-wider mb-2">Select Duration</h4>
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400">START TIME</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-3 bg-gray-50 border rounded-xl font-bold" 
                />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400">END TIME</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-3 bg-gray-50 border rounded-xl font-bold" 
                />
             </div>
          </div>
          <p className="text-[10px] text-agri-green font-bold mt-2 text-center uppercase tracking-widest">
            Predicted Work Time: {duration} Hours
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-dashed border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Price Breakdown</span>
            <span className="text-sm font-medium">{duration} hrs × ₹{item.hourlyRate}</span>
          </div>
          <div className="flex justify-between items-center mt-4 text-2xl font-black text-agri-green">
            <span>Total Payable</span>
            <span>₹{totalPrice}</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t">
        <button 
          onClick={onSubmit}
          className="w-full h-14 bg-agri-green text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Send Rental Request
        </button>
      </div>
    </motion.div>
  );
}

function Status({ owner, onBack }: { owner: string, onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      <div className="w-24 h-24 bg-green-100 text-agri-green rounded-full flex items-center justify-center mb-8">
        <CheckCircle size={56} />
      </div>
      <h2 className="text-2xl font-black text-agri-green">Request Sent!</h2>
      <p className="mt-4 text-gray-600 leading-relaxed">
        Your booking request has been sent to <strong>{owner}</strong>.
      </p>
      
      <div className="mt-12 w-full space-y-4">
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start gap-3 text-left">
          <Clock className="text-yellow-600 mt-1 shrink-0" size={18} />
          <p className="text-xs text-yellow-700">
            Request status: <strong>Pending</strong>. Machinery is reserved for 30 minutes while the owner reviews your request.
          </p>
        </div>
        
        <button 
          onClick={onBack}
          className="w-full h-14 bg-white border-2 border-agri-green text-agri-green font-bold rounded-2xl"
        >
          Back to Dashboard
        </button>
      </div>
    </motion.div>
  );
}

function ReviewForm({ onReview }: { onReview: (rating: number, comment: string) => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 shadow-sm animate-in fade-in zoom-in">
       <h4 className="text-xs font-bold text-yellow-700 mb-2 uppercase tracking-wider">How was the work?</h4>
       <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              key={star} 
              onClick={() => setRating(star)}
              className={`${rating >= star ? 'text-yellow-500' : 'text-gray-300'} transition-colors`}
            >
              <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
            </button>
          ))}
       </div>
       <textarea 
         placeholder="Add a comment (e.g. Good operator, helpful service)"
         value={comment}
         onChange={(e) => setComment(e.target.value)}
         className="w-full p-3 bg-white border border-yellow-200 rounded-xl text-xs min-h-[60px]"
       />
       <button 
         onClick={() => onReview(rating, comment)}
         className="w-full py-2 bg-yellow-600 text-white text-[10px] font-bold rounded-lg mt-3"
       >
         SUBMIT REVIEW
       </button>
    </div>
  );
}
